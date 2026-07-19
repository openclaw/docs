---
read_when:
    - Bạn đang xây dựng một plugin cần các hook `before_tool_call`, `before_agent_reply`, hook thông báo hoặc hook vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt các lệnh gọi công cụ từ một plugin
    - Bạn đang cân nhắc giữa hook nội bộ và hook của plugin
    - Bạn đang ánh xạ các lần đánh thức Cron của OpenClaw vào một bộ lập lịch máy chủ bên ngoài
summary: 'Các hook của Plugin: chặn các sự kiện vòng đời của tác tử, công cụ, tin nhắn, phiên và Gateway'
title: Hook của Plugin
x-i18n:
    generated_at: "2026-07-19T05:51:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b6a81790177d37a3b0688fddb940ef40cebab21b751cbe98de16828071a681cc
    source_path: plugins/hooks.md
    workflow: 16
---

Các hook của Plugin là các điểm mở rộng trong cùng tiến trình dành cho Plugin OpenClaw: kiểm tra hoặc
thay đổi lượt chạy của tác nhân, lệnh gọi công cụ, luồng tin nhắn, vòng đời phiên, định tuyến
tác nhân phụ, quá trình cài đặt hoặc khởi động Gateway.

Thay vào đó, hãy sử dụng [hook nội bộ](/vi/automation/hooks) cho một tập lệnh nhỏ do người vận hành cài đặt
`HOOK.md` để phản ứng với các sự kiện lệnh và Gateway như `/new`,
`/reset`, `/stop`, `agent:bootstrap` hoặc `gateway:startup`.

## Bắt đầu nhanh

Đăng ký các hook có kiểu bằng `api.on(...)` từ điểm vào của Plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Chạy tìm kiếm trên web",
            description: `Cho phép truy vấn tìm kiếm: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Các trình xử lý có thể trả về quyết định hoặc nội dung sửa đổi sẽ chạy tuần tự theo
thứ tự `priority` giảm dần; các trình xử lý có cùng mức ưu tiên giữ nguyên thứ tự đăng ký.
Các trình xử lý chỉ quan sát chạy song song, còn những lần điều phối quan sát
không chờ kết quả có thể chồng lấn với các sự kiện tiếp theo. Không sử dụng mức ưu tiên để sắp xếp
các tác dụng phụ của hoạt động quan sát.

`api.on(name, handler, opts?)` chấp nhận:

| Tùy chọn      | Tác dụng                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Thứ tự; giá trị cao hơn chạy trước.                                                                                                                                                                      |
| `timeoutMs` | Ngân sách chờ cho từng hook. Khi hết thời gian, OpenClaw ngừng chờ trình xử lý đó và tiếp tục. Việc này không hủy trình xử lý hoặc các tác dụng phụ của nó. Bỏ qua để sử dụng thời gian chờ mặc định cho từng hook của trình chạy. |

Người vận hành có thể đặt ngân sách cho hook mà không cần sửa mã Plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` ghi đè `hooks.timeoutMs`, và giá trị này ghi đè
giá trị `api.on(..., { timeoutMs })` do Plugin thiết lập. Mỗi giá trị phải là một
số nguyên dương không quá 600000 ms. Nên ưu tiên ghi đè theo từng hook cho các
hook đã biết là chậm để một Plugin không được cấp ngân sách dài hơn ở mọi nơi.

Promise của trình xử lý đã hết thời gian chờ vẫn tiếp tục chạy vì lệnh gọi lại của hook không
nhận tín hiệu hủy. Quá trình điều phối hook có thể giải phóng quyền tiếp nhận của Gateway
trong khi công việc của Plugin đó vẫn đang diễn ra. Các Plugin sở hữu
công việc chạy lâu phải tự cung cấp vòng đời hủy và tắt của riêng mình.

Các hook sửa đổi dữ liệu gửi đi `message_sending` và `reply_payload_sending` sử dụng thời gian mặc định
15 giây cho mỗi trình xử lý. Nếu một trình xử lý hết thời gian chờ, OpenClaw ghi nhật ký lỗi Plugin
và tiếp tục với payload mới nhất để luồng phân phối tuần tự có thể
hoàn tất. Hãy đặt ngân sách theo từng hook lớn hơn cho các Plugin cố ý thực hiện
công việc chậm hơn trước khi phân phối.

Các Plugin kênh sử dụng `createReplyDispatcher` cũng có thể khai báo ngân sách
dương lớn hơn cho từng giai đoạn bằng `beforeDeliverOptions: { timeoutMs }`, hoặc khi
nối thêm công việc bằng `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Nếu chủ sở hữu không khai báo ngân sách, các lệnh gọi lại đó sử dụng cùng thời gian mặc định
15 giây để một lệnh gọi lại bị treo không thể giữ luồng phân phối tuần tự.

Mỗi hook nhận `event.context.pluginConfig`, tức cấu hình đã được phân giải cho
Plugin đã đăng ký trình xử lý đó. OpenClaw chèn cấu hình này theo từng trình xử lý mà không
làm thay đổi đối tượng sự kiện dùng chung mà các Plugin khác nhìn thấy.

## Danh mục hook

Các hook được nhóm theo bề mặt mà chúng mở rộng. Các tên **in đậm** chấp nhận kết quả
quyết định (chặn, hủy, ghi đè hoặc yêu cầu phê duyệt); các hook còn lại
chỉ dùng để quan sát.

**Lượt của tác nhân**

| Hook                            | Mục đích                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Ghi đè nhà cung cấp hoặc mô hình trước khi tải tin nhắn của phiên                                  |
| `agent_turn_prepare`            | Tiêu thụ các nội dung chèn vào lượt đang xếp hàng của Plugin và thêm ngữ cảnh cùng lượt trước các hook lời nhắc      |
| `before_prompt_build`           | Thêm ngữ cảnh động hoặc văn bản lời nhắc hệ thống trước lệnh gọi mô hình                          |
| `before_agent_start`            | Giai đoạn kết hợp chỉ dành cho khả năng tương thích; ưu tiên hai hook phía trên                            |
| **`before_agent_run`**          | Kiểm tra lời nhắc cuối cùng và tin nhắn phiên trước khi gửi đến mô hình; có thể chặn lượt chạy |
| **`before_agent_reply`**        | Bỏ qua lượt mô hình bằng phản hồi tổng hợp hoặc không phản hồi                           |
| **`before_agent_finalize`**     | Kiểm tra câu trả lời cuối cùng tự nhiên và yêu cầu thêm một lượt chạy mô hình                         |
| `agent_end`                     | Quan sát tin nhắn cuối cùng, trạng thái thành công và thời lượng lượt chạy                                  |
| `heartbeat_prompt_contribution` | Thêm ngữ cảnh chỉ dành cho Heartbeat cho các Plugin giám sát nền và vòng đời                  |

**Quan sát cuộc hội thoại**

| Hook                                      | Mục đích                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Siêu dữ liệu lệnh gọi nhà cung cấp/mô hình đã được làm sạch: thời gian, kết quả, hàm băm ID yêu cầu có giới hạn. Không chứa nội dung lời nhắc hoặc phản hồi. |
| `llm_input`                               | Đầu vào của nhà cung cấp: lời nhắc hệ thống, lời nhắc, lịch sử                                                                     |
| `llm_output`                              | Đầu ra của nhà cung cấp, mức sử dụng và `contextTokenBudget` đã được phân giải khi có                                       |

**Công cụ**

| Hook                       | Mục đích                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Viết lại tham số công cụ, chặn thực thi hoặc yêu cầu phê duyệt |
| `after_tool_call`          | Quan sát kết quả công cụ, lỗi và thời lượng                |
| `resolve_exec_env`         | Đóng góp các biến môi trường do Plugin sở hữu vào `exec`   |
| **`tool_result_persist`**  | Viết lại tin nhắn của trợ lý được tạo từ kết quả công cụ |
| **`before_message_write`** | Kiểm tra hoặc chặn thao tác ghi tin nhắn đang diễn ra (hiếm khi dùng)      |

**Tin nhắn và phân phối**

| Hook                            | Mục đích                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Tiếp nhận một tin nhắn đến trước khi định tuyến tác nhân (phản hồi tổng hợp) |
| **`channel_pairing_requested`** | Quan sát các yêu cầu ghép nối tin nhắn trực tiếp mới được tạo                         |
| `message_received`              | Quan sát nội dung đến, người gửi, luồng và siêu dữ liệu             |
| **`message_sending`**           | Viết lại nội dung gửi đi hoặc hủy phân phối                       |
| **`reply_payload_sending`**     | Thay đổi hoặc hủy payload phản hồi đã chuẩn hóa trước khi phân phối        |
| `message_sent`                  | Quan sát việc phân phối đi thành công hoặc thất bại                      |
| **`before_dispatch`**           | Kiểm tra hoặc viết lại một lượt điều phối gửi đi trước khi bàn giao cho kênh    |
| **`reply_dispatch`**            | Tham gia Pipeline điều phối phản hồi cuối cùng                  |

**Phiên và Compaction**

| Hook                                     | Mục đích                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Theo dõi các ranh giới vòng đời phiên. `reason` là một trong `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` hoặc `unknown`. `shutdown`/`restart` được kích hoạt từ trình hoàn tất quá trình tắt Gateway khi tiến trình dừng hoặc khởi động lại trong lúc có các phiên đang hoạt động, để các Plugin (bộ nhớ, kho lưu bản chép lời) có thể hoàn tất các hàng mồ côi thay vì để chúng mở qua nhiều lần khởi động lại. Trình hoàn tất có giới hạn thời gian để một Plugin chậm không thể chặn SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Quan sát hoặc chú thích các chu kỳ Compaction                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Quan sát các sự kiện đặt lại phiên (`/reset`, các lần đặt lại theo chương trình)                                                                                                                                                                                                                                                                                                                                                                                                     |

Đối với các lệnh gọi `sessions.create` có `parentSessionKey` và `emitCommandHooks: true`, một tiến trình con riêng biệt luôn nhận `session_start`. Bên gọi khai báo liệu tiến trình cha có đồng thời nhận `session_end` kết thúc hay không bằng `succeedsParent`: `true` nghĩa là tiến trình kế nhiệm, `false` nghĩa là tiến trình con song song. Nếu bỏ qua, hành vi chuyển tiếp tiến trình cha cũ được giữ nguyên. Các hook `command:new` và `before_reset` vẫn mô tả hành động `/new` được yêu cầu trong cả hai trường hợp.

**Tác nhân phụ**

- `subagent_spawned` / `subagent_ended` - theo dõi việc khởi chạy và hoàn tất subagent.
- `subagent_delivery_target` - hook tương thích để chuyển thông báo hoàn tất khi không có liên kết phiên lõi nào có thể ánh xạ một tuyến.
- `subagent_spawning` - hook tương thích đã lỗi thời. Giờ đây, lõi chuẩn bị các liên kết subagent `thread: true` thông qua các bộ điều hợp liên kết phiên của kênh trước khi `subagent_spawned` kích hoạt.
- `subagent_spawned` bao gồm `resolvedModel` và `resolvedProvider` khi OpenClaw đã phân giải mô hình gốc của phiên con trước khi khởi chạy.
- `subagent_ended` mang theo `targetSessionKey` (danh tính - khớp với `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` hoặc `"acp"`), `reason`, `outcome` tùy chọn (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` hoặc `"deleted"`), `error` tùy chọn, `runId`, `endedAt`, `accountId` và `sendFarewell`. Nó **không** bao gồm `agentId` hoặc `childSessionKey`; hãy dùng `targetSessionKey` để liên kết với sự kiện `subagent_spawned` tương ứng.

**Vòng đời**

| Hook                             | Mục đích                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Khởi động hoặc dừng các dịch vụ do plugin sở hữu cùng với Gateway                                                 |
| `deactivate`                     | Bí danh tương thích đã lỗi thời cho `gateway_stop`; dùng `gateway_stop` trong các plugin mới                 |
| `cron_reconciled`                | Đối soát với toàn bộ trạng thái cron của Gateway sau khi khởi động hoặc tải lại                            |
| `cron_changed`                   | Theo dõi các thay đổi vòng đời cron do Gateway sở hữu (đã thêm, cập nhật, xóa, bắt đầu, hoàn tất, lên lịch) |
| **`before_install`**             | Kiểm tra nội dung cài đặt skill hoặc plugin đã được đưa vào vùng tạm từ một runtime plugin đã tải                         |

### Yêu cầu ghép đôi kênh

Dùng `channel_pairing_requested` khi một plugin cần thông báo cho người vận hành hoặc
ghi bản ghi kiểm tra sau khi người gửi DM chưa ghép đôi tạo một yêu cầu ghép đôi
đang chờ xử lý. Hook được phân phối khi yêu cầu được tạo; việc kênh gửi
phản hồi ghép đôi không bị trì hoãn bởi các trình xử lý hook chậm hoặc bị lỗi.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Yêu cầu ghép đôi ${event.channel} mới từ ${event.senderId}: ${event.code}`,
  });
});
```

Hook này chỉ dùng để theo dõi. Nó không phê duyệt, từ chối, chặn hoặc viết lại
phản hồi ghép đôi. Payload bao gồm kênh, `accountId` tùy chọn,
`senderId` theo phạm vi kênh, `code` ghép đôi và siêu dữ liệu kênh. Hãy coi
mã ghép đôi là thông tin xác thực phê duyệt dùng một lần đang có hiệu lực và chỉ chuyển mã đó đến một
đích nhận đáng tin cậy dành cho người vận hành. Hãy coi `metadata` là văn bản danh tính không đáng tin cậy
do người gửi cung cấp. Hook không bao gồm nội dung hoặc phương tiện của tin nhắn đến.

## Hook runtime gỡ lỗi

Dùng `before_model_resolve` để chuyển nhà cung cấp hoặc mô hình cho một lượt agent - hook này
chạy trước khi phân giải mô hình. `llm_output` chỉ chạy sau khi một lần thử mô hình
tạo ra đầu ra của trợ lý.

Để xác minh mô hình phiên có hiệu lực, hãy kiểm tra các đăng ký runtime, sau đó
dùng `openclaw sessions` hoặc các bề mặt phiên/trạng thái của Gateway. Để gỡ lỗi
payload của nhà cung cấp, hãy khởi động Gateway với `--raw-stream` và
`--raw-stream-path <path>` để ghi các sự kiện luồng mô hình thô vào một tệp jsonl.

## Chính sách gọi công cụ

`before_tool_call` nhận:

- `event.toolName`
- `event.params`
- `event.toolKind` và `event.toolInputKind` tùy chọn, các bộ phân biệt do máy chủ quyết định
  dành cho những công cụ cố ý dùng chung tên; ví dụ, các lệnh gọi `exec`
  ở chế độ mã bên ngoài dùng `toolKind: "code_mode_exec"` và bao gồm
  `toolInputKind: "javascript" | "typescript"` khi biết
  ngôn ngữ đầu vào
- `event.derivedPaths` tùy chọn, các gợi ý đường dẫn đích do máy chủ suy ra theo cơ chế nỗ lực tối đa
  cho những phong bì công cụ phổ biến như `apply_patch`; các đường dẫn này có thể
  không đầy đủ hoặc ước lượng rộng hơn phạm vi mà công cụ thực sự sẽ tác động (ví dụ
  với đầu vào không hợp lệ hoặc không đầy đủ)
- `event.runId` tùy chọn
- `event.toolCallId` tùy chọn
- các trường ngữ cảnh như `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` và `ctx.trace` chẩn đoán

Nó có thể trả về:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    /** @deprecated Các phê duyệt chưa được giải quyết luôn bị từ chối. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Hành vi bảo vệ cho các hook vòng đời có kiểu:

- `block: true` là trạng thái kết thúc và bỏ qua các trình xử lý có mức ưu tiên thấp hơn.
- `block: false` được xem là không có quyết định.
- `params` viết lại các tham số công cụ để thực thi.
- `requireApproval` tạm dừng lượt chạy agent và hỏi người dùng thông qua cơ chế
  phê duyệt của plugin. `/approve` có thể phê duyệt cả phê duyệt exec lẫn plugin. Trong các
  relay `PreToolUse` gốc ở chế độ báo cáo của máy chủ ứng dụng Codex, thao tác này chuyển quyền xử lý cho
  yêu cầu phê duyệt tương ứng của máy chủ ứng dụng; xem
  [Runtime bộ kiểm thử Codex](/vi/plugins/codex-harness-runtime#hook-boundaries).
- Một `block: true` có mức ưu tiên thấp hơn vẫn có thể chặn sau khi hook có mức ưu tiên cao hơn
  yêu cầu phê duyệt.
- `onResolution` nhận quyết định đã phân giải: `allow-once`, `allow-always`,
  `deny`, `timeout` hoặc `cancelled`.

Xem [Yêu cầu quyền của plugin](/vi/plugins/plugin-permission-requests) để biết
cách định tuyến phê duyệt, hành vi quyết định và thời điểm nên dùng `requireApproval` thay cho
các công cụ tùy chọn hoặc phê duyệt exec.

Các plugin cần chính sách cấp máy chủ có thể đăng ký chính sách công cụ đáng tin cậy bằng
`api.registerTrustedToolPolicy(...)`. Các chính sách này chạy trước các hook
`before_tool_call` thông thường và trước các quyết định hook thông thường. Các chính sách đáng tin cậy
được đóng gói sẵn chạy trước; các chính sách đáng tin cậy của plugin đã cài đặt chạy tiếp theo thứ tự tải
plugin; các hook `before_tool_call` thông thường chạy sau đó. Các plugin được đóng gói sẵn tiếp tục dùng
đường dẫn chính sách đáng tin cậy hiện có. Các plugin đã cài đặt phải được bật rõ ràng
và khai báo mọi mã định danh chính sách trong `contracts.trustedToolPolicies`; các mã định danh chưa khai báo
bị từ chối trước khi đăng ký. Mã định danh chính sách nằm trong phạm vi plugin đăng ký,
vì vậy các plugin khác nhau có thể tái sử dụng cùng một mã định danh cục bộ. Chỉ dùng tầng này
cho các cổng kiểm soát được máy chủ tin cậy như chính sách không gian làm việc, thực thi ngân sách hoặc
bảo đảm an toàn cho quy trình dành riêng.

### Hook môi trường exec

`resolve_exec_env` cho phép các plugin đóng góp biến môi trường cho các lệnh gọi công cụ `exec`
trước khi lệnh chạy. Nó nhận:

- `event.sessionKey`
- `event.toolName`, hiện luôn là `"exec"`
- `event.host`, một trong `"gateway"`, `"sandbox"` hoặc `"node"`
- các trường ngữ cảnh như `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` và `ctx.channelId`

Trả về một `Record<string, string>` để hợp nhất vào môi trường exec. Các trình xử lý
chạy theo thứ tự ưu tiên; kết quả sau ghi đè kết quả trước đối với cùng một
khóa.

Đầu ra hook được lọc qua chính sách khóa môi trường exec của máy chủ trước khi
hợp nhất. `PATH` luôn bị loại bỏ (việc phân giải lệnh và kiểm tra tệp nhị phân an toàn
phụ thuộc vào biến này). Các khóa không hợp lệ và khóa ghi đè máy chủ nguy hiểm như `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, các biến proxy (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) và các biến ghi đè TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` cùng các biến tương tự) đều bị loại bỏ. Môi trường plugin đã lọc được đưa vào
siêu dữ liệu phê duyệt/kiểm tra của Gateway và chuyển tiếp đến các yêu cầu thực thi
trên máy chủ node.

### Lưu trữ lâu dài kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để kết xuất giao diện người dùng, chẩn đoán,
định tuyến phương tiện hoặc siêu dữ liệu do plugin sở hữu. Hãy coi `details` là siêu dữ liệu runtime,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi phát lại cho nhà cung cấp và trước đầu vào
  Compaction để siêu dữ liệu không trở thành ngữ cảnh mô hình.
- Các mục phiên được lưu lâu dài chỉ giữ lại `details` có kích thước giới hạn. Chi tiết quá lớn được
  thay thế bằng một bản tóm tắt ngắn gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn
  lưu trữ cuối cùng. Giữ `details` được trả về ở kích thước nhỏ và tránh chỉ đặt
  văn bản liên quan đến prompt trong `details`; hãy đặt đầu ra công cụ mà mô hình có thể thấy trong
  `content`.

## Hook prompt và mô hình

Dùng các hook theo từng giai đoạn cho plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và siêu dữ liệu
  tệp đính kèm. Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, các thông báo phiên
  đã chuẩn bị và mọi nội dung chèn vào hàng đợi theo cơ chế chính xác một lần đã được lấy ra cho phiên này.
  Trả về `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và các thông báo phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho các lượt Heartbeat và trả về
  `prependContext` hoặc `appendContext`. Dành cho các trình giám sát nền cần
  tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_start` vẫn được giữ để tương thích. Ưu tiên các hook rõ ràng
ở trên để plugin không phụ thuộc vào một giai đoạn kết hợp kiểu cũ.

`before_agent_run` chạy sau khi xây dựng prompt và trước mọi đầu vào mô hình,
bao gồm việc tải hình ảnh cục bộ của prompt và hoạt động theo dõi `llm_input`. Nó nhận
đầu vào hiện tại của người dùng dưới dạng `prompt`, cùng với lịch sử phiên đã tải trong `messages`
và prompt hệ thống đang hoạt động. Trả về `{ outcome: "block", reason, message? }`
để dừng lượt chạy trước khi mô hình đọc prompt. `reason` là nội bộ;
`message` là nội dung thay thế hướng đến người dùng. Chỉ hỗ trợ kết quả `pass` và `block`;
các dạng quyết định không được hỗ trợ sẽ đóng để bảo đảm an toàn.

Khi một lượt chạy bị chặn, OpenClaw chỉ lưu văn bản thay thế trong
`message.content` cùng với siêu dữ liệu chặn không nhạy cảm như mã định danh
plugin chặn và dấu thời gian. Văn bản gốc của người dùng không được giữ lại trong bản chép lời
hoặc ngữ cảnh tương lai. Các lý do chặn nội bộ được coi là nhạy cảm và
bị loại khỏi payload bản chép lời, lịch sử, phát sóng, nhật ký và chẩn đoán.
Khả năng quan sát nên dùng các trường đã làm sạch như mã định danh trình chặn, kết quả,
dấu thời gian hoặc một danh mục an toàn.

`before_agent_start` và `agent_end` bao gồm `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động; cùng giá trị đó cũng có trên `ctx.runId`. Các lượt chạy
do Cron điều khiển cũng cung cấp `ctx.jobId` (mã định danh tác vụ cron khởi nguồn) trên ngữ cảnh
lượt agent để các hook có thể giới hạn phạm vi chỉ số, tác dụng phụ hoặc trạng thái vào một
tác vụ đã lên lịch cụ thể. `ctx.jobId` không thuộc ngữ cảnh công cụ `before_tool_call`.

Đối với các lượt chạy bắt nguồn từ kênh, `ctx.channel` và `ctx.messageProvider` xác định
bề mặt nhà cung cấp như `discord` hoặc `telegram`, còn `ctx.channelId` là
mã định danh đích hội thoại khi OpenClaw có thể suy ra mã này từ
khóa phiên hoặc siêu dữ liệu phân phối.

Khi có danh tính người gửi, ngữ cảnh hook của tác tử cũng bao gồm:

- `ctx.senderId` - ID người gửi trong phạm vi kênh (ví dụ: Feishu `open_id`, ID người dùng Discord).
  Được điền khi lượt chạy bắt nguồn từ tin nhắn của người dùng có
  siêu dữ liệu người gửi đã biết.
- `ctx.chatId` - mã định danh hội thoại gốc của phương thức vận chuyển (ví dụ: Feishu
  `chat_id`, Telegram `chat_id`). Được điền khi kênh khởi nguồn
  cung cấp ID hội thoại gốc.
- `ctx.channelContext.sender.id` - cùng ID người gửi với `ctx.senderId`, nằm trong
  một đối tượng do kênh sở hữu mà các plugin có thể mở rộng bằng các trường dành riêng cho kênh.
- `ctx.channelContext.chat.id` - cùng ID hội thoại với `ctx.chatId`,
  nằm trong một đối tượng do kênh sở hữu mà các plugin có thể mở rộng bằng các trường
  dành riêng cho kênh.

Phần lõi chỉ định nghĩa các trường `id` lồng nhau. Các plugin kênh chuyển
siêu dữ liệu phong phú hơn về người gửi hoặc cuộc trò chuyện qua trình trợ giúp đầu vào có thể bổ sung
`PluginHookChannelSenderContext` hoặc `PluginHookChannelChatContext` từ
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Các plugin kênh chuyển những trường đó qua trình trợ giúp SDK đầu vào:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Các trường này là tùy chọn và không tồn tại đối với các lượt chạy bắt nguồn từ hệ thống (heartbeat,
cron, sự kiện exec).

`ctx.senderExternalId` vẫn tồn tại dưới dạng trường tương thích mã nguồn đã lỗi thời dành cho
các plugin cũ. Phần lõi không điền trường này; các danh tính người gửi mới dành riêng cho kênh
nên nằm trong `ctx.channelContext.sender` thông qua cơ chế bổ sung
mô-đun.

`agent_end` là một hook quan sát. Các đường dẫn Gateway và bộ khung cố định chạy
hook này theo kiểu kích hoạt rồi không chờ sau lượt tương tác, trong khi các đường dẫn CLI dùng một lần có thời gian sống ngắn sẽ chờ
promise của hook trước khi dọn dẹp tiến trình để các plugin đáng tin cậy có thể đẩy hết
dữ liệu quan sát đầu cuối hoặc ghi lại trạng thái. Trình chạy hook áp dụng thời gian chờ 30 giây
để một plugin bị treo hoặc điểm cuối nhúng không thể khiến promise của hook
chờ vô thời hạn. OpenClaw ghi nhật ký khi hết thời gian chờ rồi tiếp tục; hệ thống không
hủy tác vụ mạng do plugin sở hữu, trừ khi plugin cũng sử dụng tín hiệu hủy
riêng.

Sử dụng `model_call_started` và `model_call_ended` cho dữ liệu đo từ xa của lệnh gọi nhà cung cấp
không được nhận prompt thô, lịch sử, phản hồi, tiêu đề, nội dung
yêu cầu hoặc ID yêu cầu của nhà cung cấp. Các hook này bao gồm siêu dữ liệu ổn định như
`runId`, `callId`, `provider`, `model`, `api`/`transport` tùy chọn, các trường kết thúc
`durationMs`/`outcome`, và `upstreamRequestIdHash` khi OpenClaw có thể suy ra một
hàm băm ID yêu cầu nhà cung cấp có giới hạn. Khi runtime đã phân giải
siêu dữ liệu cửa sổ ngữ cảnh, sự kiện và ngữ cảnh hook cũng bao gồm
`contextTokenBudget`, ngân sách token hiệu dụng sau các giới hạn của mô hình/cấu hình/tác tử,
cùng với `contextWindowSource` và `contextWindowReferenceTokens` khi
một giới hạn thấp hơn được áp dụng.

`before_agent_finalize` chỉ chạy khi bộ khung sắp chấp nhận một câu trả lời tự nhiên
cuối cùng của trợ lý. Đây không phải đường dẫn hủy `/stop` và không
chạy khi người dùng hủy một lượt. Trả về `{ action: "revise", reason }` để yêu cầu
bộ khung thực hiện thêm một lượt mô hình trước khi hoàn tất, `{ action:
"finalize", reason? }` để buộc hoàn tất, hoặc bỏ qua kết quả để tiếp tục.
Các trình xử lý có ngân sách mặc định là 15 giây; khi hết thời gian chờ, OpenClaw ghi nhật ký lỗi và
tiếp tục với câu trả lời cuối cùng ban đầu.
Các hook `Stop` gốc của Codex được chuyển tiếp vào hook này dưới dạng các
quyết định `before_agent_finalize` của OpenClaw.

Khi trả về `action: "revise"`, các plugin có thể bao gồm siêu dữ liệu `retry` để
giới hạn lượt mô hình bổ sung và bảo đảm phát lại an toàn:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` được nối vào lý do sửa đổi gửi đến bộ khung.
`idempotencyKey` cho phép máy chủ đếm số lần thử lại cho cùng một yêu cầu plugin
qua các quyết định hoàn tất tương đương, và `maxAttempts` giới hạn số lượt bổ sung
mà máy chủ sẽ cho phép trước khi tiếp tục với câu trả lời cuối cùng tự nhiên.

Các plugin không đi kèm cần hook hội thoại thô (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` hoặc `before_agent_run`) phải đặt:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Có thể vô hiệu hóa các hook sửa đổi prompt và nội dung chèn bền vững cho lượt tiếp theo theo từng
plugin bằng `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Phần mở rộng phiên và nội dung chèn cho lượt tiếp theo

Các plugin quy trình làm việc có thể duy trì trạng thái phiên nhỏ tương thích với JSON bằng
`api.session.state.registerSessionExtension(...)` và cập nhật trạng thái đó thông qua
phương thức Gateway `sessions.pluginPatch`. Các hàng phiên chiếu trạng thái
phần mở rộng đã đăng ký qua `pluginExtensions`, cho phép Control UI và các
máy khách khác hiển thị trạng thái do plugin sở hữu mà không cần biết chi tiết nội bộ của plugin.
`api.registerSessionExtension(...)` vẫn hoạt động nhưng đã lỗi thời; nên dùng
không gian tên `api.session.state`.

Sử dụng `api.session.workflow.enqueueNextTurnInjection(...)` khi plugin cần
ngữ cảnh bền vững được chuyển đến lượt mô hình tiếp theo đúng một lần (`api.enqueueNextTurnInjection(...)` cấp cao nhất
là bí danh đã lỗi thời có cùng
hành vi). OpenClaw rút hết các nội dung chèn đang xếp hàng trước các hook prompt, loại bỏ
nội dung chèn đã hết hạn và loại bỏ trùng lặp theo `idempotencyKey` cho mỗi plugin. Đây là
điểm nối phù hợp cho việc tiếp tục sau phê duyệt, bản tóm tắt chính sách, phần thay đổi từ trình giám sát
nền và phần tiếp nối lệnh cần hiển thị cho mô hình ở
lượt tiếp theo nhưng không được trở thành văn bản prompt hệ thống vĩnh viễn.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Các lệnh gọi lại dọn dẹp phần mở rộng phiên và
vòng đời runtime nhận `reset`, `delete`, `disable` hoặc
`restart`. Máy chủ xóa trạng thái phần mở rộng phiên cố định
và các nội dung chèn đang chờ cho lượt tiếp theo thuộc plugin sở hữu khi đặt lại/xóa/vô hiệu hóa; thao tác khởi động lại
giữ nguyên trạng thái phiên bền vững, trong khi các lệnh gọi lại dọn dẹp cho phép plugin giải phóng
các tác vụ bộ lập lịch, ngữ cảnh chạy và các tài nguyên ngoài luồng khác của thế hệ
runtime cũ.

## Hook tin nhắn

Sử dụng hook tin nhắn cho chính sách định tuyến và phân phối ở cấp kênh:

- `message_received`: quan sát nội dung đầu vào, người gửi, `threadId`,
  `messageId`, `senderId`, thông tin tương quan lượt chạy/phiên tùy chọn và siêu dữ liệu.
- `message_sending`: viết lại `content` hoặc trả về `{ cancel: true }`.
- `reply_payload_sending`: viết lại các đối tượng `ReplyPayload` đã chuẩn hóa
  (bao gồm `presentation`, `delivery`, tham chiếu phương tiện và văn bản) hoặc trả về
  `{ cancel: true }`.
- `message_sent`: quan sát kết quả thành công hoặc thất bại cuối cùng.

Đối với câu trả lời TTS chỉ có âm thanh, `content` có thể chứa bản chép lời nói
bị ẩn ngay cả khi tải trọng kênh không có văn bản/chú thích hiển thị.
Việc viết lại `content` đó chỉ cập nhật bản chép lời mà hook nhìn thấy; nội dung này không được
hiển thị dưới dạng chú thích phương tiện.

Các sự kiện `reply_payload_sending` có thể bao gồm `usageState`, một ảnh chụp nhanh trực tiếp
về mô hình/mức sử dụng/ngữ cảnh theo từng lượt theo cơ chế nỗ lực tối đa. Hoạt động phân phối bền vững, phát lại đã khôi phục và
các câu trả lời không có thông tin tương quan chính xác với lượt chạy sẽ bỏ qua trường này.

Ngữ cảnh hook tin nhắn cung cấp các trường tương quan ổn định khi có:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` và `ctx.callDepth`. Ngữ cảnh đầu vào
và `before_dispatch` cũng cung cấp siêu dữ liệu trả lời khi kênh
có dữ liệu tin nhắn được trích dẫn đã lọc theo khả năng hiển thị: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` và `replyToIsQuote`. Ưu tiên các
trường hạng nhất này trước khi đọc siêu dữ liệu cũ.

Ưu tiên các trường `threadId` và `replyToId` có kiểu trước khi sử dụng siêu dữ liệu
dành riêng cho kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là kết thúc.
- `message_sending` với `cancel: false` được coi là không có quyết định.
- `content` đã viết lại tiếp tục tới các hook có độ ưu tiên thấp hơn, trừ khi một hook sau đó
  hủy phân phối.
- `reply_payload_sending` chạy sau khi chuẩn hóa tải trọng và trước khi phân phối qua kênh,
  bao gồm cả các câu trả lời được định tuyến ngược về kênh khởi nguồn.
  Các trình xử lý chạy tuần tự và mỗi trình xử lý thấy tải trọng mới nhất do
  các trình xử lý có độ ưu tiên cao hơn tạo ra.
- Tải trọng `reply_payload_sending` không cung cấp các dấu hiệu tin cậy của runtime như
  `trustedLocalMedia`; plugin có thể chỉnh sửa hình dạng tải trọng nhưng không thể cấp quyền tin cậy
  cho phương tiện cục bộ.
- `message_sending` có thể trả về `cancelReason` và `metadata` có giới hạn cùng với
  thao tác hủy. Các API vòng đời tin nhắn mới biểu thị điều này dưới dạng kết quả
  phân phối bị chặn với lý do `cancelled_by_message_sending_hook`; cơ chế
  phân phối trực tiếp cũ vẫn trả về một mảng kết quả trống để đảm bảo khả năng tương thích.
- `message_sent` chỉ dùng để quan sát. Lỗi của trình xử lý được ghi nhật ký và không
  thay đổi kết quả phân phối.

## Hook cài đặt

Sử dụng `security.installPolicy` cho các quyết định cho phép/chặn do người vận hành sở hữu. Chính sách đó
chạy từ cấu hình OpenClaw, áp dụng cho các đường dẫn cài đặt và cập nhật CLI, đồng thời
từ chối theo mặc định khi được bật nhưng không khả dụng.

`before_install` là hook vòng đời runtime plugin. Hook này chạy sau
`security.installPolicy` chỉ trong tiến trình OpenClaw nơi các hook plugin
đã được tải, chẳng hạn như các luồng cài đặt dựa trên Gateway. Hook này hữu ích cho
các quan sát, cảnh báo và kiểm tra khả năng tương thích do plugin sở hữu, nhưng không phải là
ranh giới bảo mật chính của doanh nghiệp hoặc máy chủ đối với thao tác cài đặt. Trường
`builtinScan` vẫn nằm trong tải trọng sự kiện để đảm bảo khả năng tương thích, nhưng
OpenClaw không còn chạy cơ chế chặn mã nguy hiểm tích hợp sẵn tại thời điểm cài đặt, vì vậy
đây là một kết quả `ok` trống. Trả về các phát hiện bổ sung hoặc
`{ block: true, blockReason }` để dừng cài đặt trong tiến trình đó.

`block: true` là kết thúc. `block: false` được coi là không có quyết định. Lỗi của trình xử lý
sẽ chặn cài đặt theo cơ chế từ chối mặc định.

## Vòng đời Gateway

Sử dụng `gateway_start` để khởi động các dịch vụ plugin chung và `gateway_stop` để
dọn dẹp các tài nguyên chạy dài hạn. Bộ lập lịch cron vẫn có thể đang tải khi
`gateway_start` chạy, vì vậy không sử dụng hook này làm tín hiệu cơ sở cho một
phép chiếu cron bên ngoài.

Không dựa vào hook nội bộ `gateway:startup` cho các dịch vụ runtime
do plugin sở hữu.

`cron_reconciled` kích hoạt sau khi bộ lập lịch cron của Gateway và các trình theo dõi khi thoát
đã đối soát trạng thái bền vững của chúng. Hook này kích hoạt cả khi
khởi động ban đầu lẫn khi thay thế bộ lập lịch trong quá trình tải lại cấu hình. Sự kiện báo cáo
`reason` (`startup` hoặc `reload`) và trạng thái `enabled` hiệu dụng. Cron bị vô hiệu hóa
vẫn phát sự kiện với `enabled: false`, cho phép phép chiếu bên ngoài
xóa các lần đánh thức cũ. Sử dụng `ctx.getCron?.()` cho chính xác phiên bản bộ lập lịch đã
hoàn tất việc đối soát; lần tải lại sau đó không chuyển hướng lệnh gọi lại đó.
`ctx.abortSignal` sở hữu cùng ảnh chụp nhanh bộ lập lịch đó. Gateway hủy tín hiệu này ngay khi
một bộ lập lịch mới hơn được kích hoạt hoặc quá trình tắt bắt đầu. Chuyển tín hiệu này qua mọi
tác dụng phụ bền vững và không chấp nhận ảnh chụp nhanh sau khi tín hiệu bị hủy.
Đây là tín hiệu vòng đời bộ lập lịch, không phải tín hiệu kích hoạt plugin:
thao tác tải lại nóng chỉ dành cho plugin không phát lại tín hiệu này. Một phần tiêu thụ mới được bật sẽ nhận
trạng thái cơ sở đầu tiên vào lần thay thế bộ lập lịch tiếp theo hoặc khi Gateway khởi động.

Giống như các hook quan sát khác, lệnh gọi lại `gateway_start` và `cron_reconciled`
có thể chồng lấp. Nếu cả hai trình xử lý dùng chung quá trình khởi tạo plugin, hãy điều phối chúng
bằng một promise sẵn sàng cục bộ của plugin thay vì phụ thuộc vào thứ tự lệnh gọi lại.

`cron_changed` được kích hoạt cho các sự kiện vòng đời Cron do Gateway sở hữu, với payload sự kiện có kiểu bao quát các lý do `added`, `updated`, `removed`, `started`, `finished`,
và `scheduled`. Sự kiện mang theo một ảnh chụp nhanh `PluginHookGatewayCronJob`
(bao gồm `state.nextRunAtMs`, `state.lastRunStatus` và
`state.lastError` khi có) cùng với một `PluginHookGatewayCronDeliveryStatus`
thuộc `not-requested` | `delivered` | `not-delivered` | `unknown`. Các sự kiện đã xóa
diễn ra sau khi commit: chúng chỉ được kích hoạt sau khi thao tác xóa bền vững thành công và vẫn mang theo
ảnh chụp nhanh của tác vụ đã xóa để các bộ lập lịch bên ngoài có thể đối soát trạng thái.

Sự kiện `scheduled` diễn ra sau khi commit: nó chỉ được kích hoạt sau khi một thao tác
ghi bền vững thành công làm thay đổi `nextRunAtMs` hiệu lực của một tác vụ hiện có, không bao gồm sự kiện vòng đời
`added`, `updated` hoặc `removed` tường minh của tác vụ đó. `event.nextRunAtMs`
ở cấp cao nhất là lần đánh thức tiếp theo đã được commit; khi không có giá trị này, tác vụ
không có lần đánh thức tiếp theo. Hãy coi các sự kiện này là gợi ý đối soát, không phải nhật ký delta
có thứ tự. Sử dụng chúng làm các gợi ý có thể hợp nhất để đọc lại bộ lập lịch được
`cron_reconciled` ghi nhận gần nhất; không tiếp nhận bộ lập lịch từ ngữ cảnh `cron_changed`.
Giữ OpenClaw làm nguồn dữ liệu chuẩn cho việc kiểm tra đến hạn và thực thi.

### Chiếu Cron bên ngoài an toàn

Chiếu một ảnh chụp nhanh đánh thức hoàn chỉnh thay vì chuyển tiếp các delta sự kiện Cron. Thao tác
`replaceAll` của bộ điều hợp bên ngoài phải có tính nguyên tử và lũy đẳng, đồng thời
chỉ được hoàn tất sau khi máy chủ đã chấp nhận ảnh chụp nhanh một cách bền vững. Thao tác này
cũng phải tuân theo tín hiệu hủy được cung cấp: nếu tín hiệu hủy trước khi
chấp nhận bền vững, bộ điều hợp không được chấp nhận ảnh chụp nhanh đó.

Mẫu này chỉ duy trì một worker trạng thái mới nhất đang hoạt động. Chỉ `cron_reconciled`
tiếp nhận một phiên bản bộ lập lịch; `cron_changed` chỉ yêu cầu worker đó đọc lại
phiên bản có thẩm quyền, vì vậy một gợi ý đến muộn không thể khôi phục bộ lập lịch cũ hơn.
Một bản sửa đổi mới hơn sẽ hủy lần thử đang hoạt động trên máy chủ trước khi nó có thể chấp nhận
ảnh chụp nhanh lỗi thời.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Khi `cron_reconciled` báo cáo `enabled: false`, cùng đường dẫn đó sẽ gọi
`replaceAll([])` và xóa các lần đánh thức bên ngoài lỗi thời. Cơ chế thử lại/chờ lùi trong ví dụ này
chỉ áp dụng cục bộ trong tiến trình và coi lỗi bộ điều hợp lúc chạy là tạm thời; hãy xác thực
cấu hình không thể thử lại trước khi đăng ký. OpenClaw không cung cấp
outbox cho các hiệu ứng của hook Plugin. Nếu tiến trình thoát trước khi được chấp nhận bền vững,
lần khởi động Gateway tiếp theo sẽ phát một ảnh chụp nhanh `cron_reconciled` có thẩm quyền mới.
`gateway_stop` hủy công việc đang thực hiện trên máy chủ, chờ worker ổn định, sau đó
đóng bộ điều hợp.

## Các tính năng sắp ngừng hỗ trợ

Một số bề mặt liền kề hook đã bị đánh dấu ngừng hỗ trợ nhưng vẫn được hỗ trợ. Hãy di chuyển
trước bản phát hành lớn tiếp theo:

- **Phong bì kênh dạng văn bản thuần túy** trong các trình xử lý `inbound_claim` và `message_received`.
  Đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc
  thay vì phân tích văn bản phong bì phẳng. Xem
  [Phong bì kênh dạng văn bản thuần túy → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** vẫn được duy trì để tương thích. Các Plugin mới nên sử dụng
  `before_model_resolve` và `before_prompt_build` thay cho
  giai đoạn kết hợp.
- **`subagent_spawning`** vẫn được duy trì để tương thích với các Plugin cũ, nhưng
  các Plugin mới không nên trả về định tuyến luồng từ đó. Phần lõi chuẩn bị
  các liên kết tác nhân con `thread: true` thông qua bộ điều hợp liên kết phiên của kênh
  trước khi `subagent_spawned` được kích hoạt.
- **`deactivate`** vẫn là bí danh tương thích dọn dẹp đã ngừng hỗ trợ cho đến
  sau 2026-08-16. Các Plugin mới nên sử dụng `gateway_stop`.
- **`onResolution` trong `before_tool_call`** hiện sử dụng
  union có kiểu `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) thay cho `string` dạng tự do.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** vẫn được duy trì
  dưới dạng bí danh tương thích cấp cao nhất. Các Plugin mới nên sử dụng
  `api.session.state.registerSessionExtension(...)` và
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Để xem danh sách đầy đủ — đăng ký khả năng bộ nhớ, hồ sơ tư duy của nhà cung cấp,
nhà cung cấp xác thực bên ngoài, kiểu khám phá nhà cung cấp, trình truy cập môi trường chạy
tác vụ và việc đổi tên `command-auth` → `command-status` — hãy xem
[Di chuyển Plugin SDK → Các tính năng đang ngừng hỗ trợ](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Di chuyển Plugin SDK](/vi/plugins/sdk-migration) - các tính năng đang ngừng hỗ trợ và lịch trình loại bỏ
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tổng quan về Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Hook nội bộ](/vi/automation/hooks)
- [Chi tiết nội bộ về kiến trúc Plugin](/vi/plugins/architecture-internals)
