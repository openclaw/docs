---
read_when:
    - Bạn đang xây dựng một plugin cần các hook `before_tool_call`, `before_agent_reply`, hook tin nhắn hoặc hook vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt các lệnh gọi công cụ từ một plugin
    - Bạn đang lựa chọn giữa hook nội bộ và hook của plugin
    - Bạn đang ánh xạ các lần đánh thức Cron của OpenClaw sang một bộ lập lịch máy chủ bên ngoài
summary: 'Hook Plugin: chặn các sự kiện vòng đời của tác tử, công cụ, tin nhắn, phiên và Gateway'
title: Hook của Plugin
x-i18n:
    generated_at: "2026-07-20T04:41:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330deb9a7dfbf69b8bb5c7e06f61d4d1a0db670abff20328cac5858bc893c326
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin hooks là các điểm mở rộng trong tiến trình dành cho plugin OpenClaw: kiểm tra hoặc
thay đổi lượt chạy của tác tử, lệnh gọi công cụ, luồng tin nhắn, vòng đời phiên, định tuyến
tác tử con, quá trình cài đặt hoặc quá trình khởi động Gateway.

Thay vào đó, hãy dùng [hook nội bộ](/vi/automation/hooks) cho một tập lệnh nhỏ `HOOK.md`
do người vận hành cài đặt, phản ứng với các sự kiện lệnh và Gateway như `/new`,
`/reset`, `/stop`, `agent:bootstrap` hoặc `gateway:startup`.

## Bắt đầu nhanh

Đăng ký các hook có kiểu bằng `api.on(...)` từ điểm vào của plugin:

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
            title: "Cho phép tìm kiếm trên web",
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
`priority` giảm dần; các trình xử lý có cùng mức ưu tiên giữ nguyên thứ tự đăng ký.
Các trình xử lý chỉ quan sát chạy song song, còn những lần điều phối quan sát
không chờ kết quả có thể chồng lấn với các sự kiện tiếp theo. Không dùng mức ưu tiên để sắp xếp
các tác dụng phụ của hoạt động quan sát.

`api.on(name, handler, opts?)` chấp nhận:

| Tùy chọn      | Tác dụng                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Thứ tự; giá trị cao hơn chạy trước.                                                                                                                                                                      |
| `timeoutMs` | Ngân sách chờ cho mỗi hook. Khi hết thời gian, OpenClaw ngừng chờ trình xử lý đó và tiếp tục. Việc này không hủy trình xử lý hoặc các tác dụng phụ của nó. Bỏ qua để dùng thời gian chờ mặc định cho mỗi hook của trình chạy. |

Người vận hành có thể đặt ngân sách hook mà không cần sửa mã plugin:

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

`hooks.timeouts.<hookName>` ghi đè `hooks.timeoutMs`, còn giá trị này ghi đè giá trị
`api.on(..., { timeoutMs })` do tác giả plugin đặt. Mỗi giá trị phải là một
số nguyên dương không quá 600000 ms. Ưu tiên ghi đè theo từng hook đối với các
hook được biết là chậm để một plugin không nhận ngân sách dài hơn ở mọi nơi.

Promise của trình xử lý đã hết thời gian vẫn tiếp tục chạy vì callback hook không
nhận tín hiệu hủy. Quá trình điều phối hook có thể giải phóng quyền tiếp nhận của Gateway
trong khi công việc của plugin đó vẫn đang diễn ra. Các plugin sở hữu
công việc chạy dài phải tự cung cấp vòng đời hủy và tắt.

Các hook sửa đổi đầu ra `message_sending` và `reply_payload_sending` dùng thời gian mặc định
15 giây cho mỗi trình xử lý. Nếu một trình xử lý hết thời gian, OpenClaw ghi nhật ký lỗi plugin
và tiếp tục với payload mới nhất để làn phân phối tuần tự có thể
hoàn tất. Hãy đặt ngân sách theo hook lớn hơn cho những plugin chủ ý thực hiện công việc
chậm hơn trước khi phân phối.

Các plugin kênh dùng `createReplyDispatcher` cũng có thể khai báo ngân sách dương
lớn hơn cho mỗi giai đoạn bằng `beforeDeliverOptions: { timeoutMs }`, hoặc khi
nối thêm công việc bằng `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Nếu chủ sở hữu không khai báo ngân sách, các callback đó dùng cùng giá trị mặc định
15 giây để một callback bị treo không thể giữ làn phân phối tuần tự.

Mỗi hook nhận `event.context.pluginConfig`, tức cấu hình đã phân giải cho
plugin đã đăng ký trình xử lý đó. OpenClaw chèn cấu hình này theo từng trình xử lý mà không
làm thay đổi đối tượng sự kiện dùng chung mà các plugin khác nhìn thấy.

## Danh mục hook

Các hook được nhóm theo bề mặt mà chúng mở rộng. Tên **in đậm** chấp nhận kết quả
quyết định (chặn, hủy, ghi đè hoặc yêu cầu phê duyệt); các hook còn lại
chỉ dùng để quan sát.

**Lượt tác tử**

| Hook                            | Mục đích                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Ghi đè nhà cung cấp hoặc mô hình trước khi tải tin nhắn phiên                                  |
| `agent_turn_prepare`            | Tiêu thụ các nội dung chèn lượt của plugin đang chờ và thêm ngữ cảnh cùng lượt trước các hook prompt      |
| `before_prompt_build`           | Thêm ngữ cảnh động hoặc văn bản prompt hệ thống trước lệnh gọi mô hình                          |
| **`before_agent_run`**          | Kiểm tra prompt cuối cùng và tin nhắn phiên trước khi gửi đến mô hình; có thể chặn lượt chạy |
| **`before_agent_reply`**        | Kết thúc sớm lượt mô hình bằng phản hồi tổng hợp hoặc không phản hồi                           |
| **`before_agent_finalize`**     | Kiểm tra câu trả lời cuối cùng tự nhiên và yêu cầu thêm một lượt mô hình                         |
| `agent_end`                     | Quan sát tin nhắn cuối cùng, trạng thái thành công và thời lượng chạy                                  |
| `heartbeat_prompt_contribution` | Thêm ngữ cảnh chỉ dành cho Heartbeat cho các plugin giám sát nền và vòng đời                  |

**Quan sát cuộc hội thoại**

| Hook                                      | Mục đích                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Siêu dữ liệu lệnh gọi nhà cung cấp/mô hình đã được làm sạch: thời gian, kết quả, hàm băm ID yêu cầu có giới hạn. Không có nội dung prompt hoặc phản hồi. |
| `llm_input`                               | Đầu vào của nhà cung cấp: prompt hệ thống, prompt, lịch sử                                                                     |
| `llm_output`                              | Đầu ra của nhà cung cấp, mức sử dụng và `contextTokenBudget` đã phân giải khi có                                       |

**Công cụ**

| Hook                       | Mục đích                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Viết lại tham số công cụ, chặn thực thi hoặc yêu cầu phê duyệt |
| `after_tool_call`          | Quan sát kết quả công cụ, lỗi và thời lượng                |
| `resolve_exec_env`         | Đóng góp các biến môi trường do plugin sở hữu vào `exec`   |
| **`tool_result_persist`**  | Viết lại tin nhắn của trợ lý được tạo từ kết quả công cụ |
| **`before_message_write`** | Kiểm tra hoặc chặn một thao tác ghi tin nhắn đang diễn ra (hiếm)      |

**Tin nhắn và phân phối**

| Hook                            | Mục đích                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Tiếp nhận một tin nhắn đến trước khi định tuyến tác tử (phản hồi tổng hợp) |
| **`channel_pairing_requested`** | Quan sát các yêu cầu ghép nối DM mới được tạo                         |
| `message_received`              | Quan sát nội dung đến, người gửi, luồng và siêu dữ liệu             |
| **`message_sending`**           | Viết lại nội dung gửi đi hoặc hủy phân phối                       |
| **`reply_payload_sending`**     | Thay đổi hoặc hủy payload phản hồi đã chuẩn hóa trước khi phân phối        |
| `message_sent`                  | Quan sát việc phân phối đầu ra thành công hoặc thất bại                      |
| **`before_dispatch`**           | Kiểm tra hoặc viết lại một lượt điều phối đầu ra trước khi bàn giao cho kênh    |
| **`reply_dispatch`**            | Tham gia pipeline điều phối phản hồi cuối cùng                  |

**Phiên và Compaction**

| Hook                                     | Mục đích                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Theo dõi các ranh giới vòng đời phiên. `reason` là một trong `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` hoặc `unknown`. `shutdown`/`restart` kích hoạt từ trình hoàn tất tắt Gateway khi tiến trình dừng hoặc khởi động lại trong lúc có các phiên đang hoạt động, để các plugin (bộ nhớ, kho bản chép lời) có thể hoàn tất các hàng mồ côi thay vì để chúng mở qua các lần khởi động lại. Trình hoàn tất có giới hạn thời gian để một plugin chậm không thể chặn SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Quan sát hoặc chú thích các chu kỳ Compaction                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Quan sát các sự kiện đặt lại phiên (`/reset`, đặt lại bằng chương trình)                                                                                                                                                                                                                                                                                                                                                                                                     |

Đối với các lệnh gọi `sessions.create` có `parentSessionKey` và `emitCommandHooks: true`, một tiến trình con riêng biệt luôn nhận `session_start`. Bên gọi khai báo liệu tiến trình cha cũng nhận `session_end` kết thúc bằng `succeedsParent` hay không: `true` nghĩa là tiến trình kế nhiệm, `false` nghĩa là tiến trình con song song. Việc bỏ qua duy trì hành vi chuyển tiếp tiến trình cha kiểu cũ. Các hook `command:new` và `before_reset` vẫn mô tả hành động `/new` được yêu cầu trong cả hai trường hợp.

**Tác tử con**

- `subagent_spawned` / `subagent_ended` - theo dõi việc khởi chạy và hoàn tất subagent.
- `subagent_delivery_target` - hook tương thích để chuyển thông báo hoàn tất khi không có liên kết phiên lõi nào có thể ánh xạ một tuyến.
- `subagent_spawning` - hook tương thích đã ngừng dùng. Lõi hiện chuẩn bị các liên kết subagent `thread: true` thông qua bộ điều hợp liên kết phiên của kênh trước khi `subagent_spawned` kích hoạt.
- `subagent_spawned` bao gồm `resolvedModel` và `resolvedProvider` khi OpenClaw đã phân giải mô hình gốc của phiên con trước khi khởi chạy.
- `subagent_ended` mang theo `targetSessionKey` (danh tính - khớp với `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` hoặc `"acp"`), `reason`, `outcome` tùy chọn (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` hoặc `"deleted"`), `error` tùy chọn, `runId`, `endedAt`, `accountId` và `sendFarewell`. Nó **không** bao gồm `agentId` hoặc `childSessionKey`; hãy dùng `targetSessionKey` để đối chiếu với sự kiện `subagent_spawned` tương ứng.

**Vòng đời**

| Hook                             | Mục đích                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Khởi động hoặc dừng các dịch vụ do plugin sở hữu cùng với Gateway                                                 |
| `deactivate`                     | Bí danh tương thích đã ngừng dùng cho `gateway_stop`; dùng `gateway_stop` trong các plugin mới                 |
| `cron_reconciled`                | Đối soát với toàn bộ trạng thái Cron của Gateway sau khi khởi động hoặc tải lại                            |
| `cron_changed`                   | Theo dõi các thay đổi vòng đời Cron do Gateway sở hữu (đã thêm, đã cập nhật, đã xóa, đã bắt đầu, đã hoàn tất, đã lên lịch) |
| **`before_install`**             | Kiểm tra vật liệu cài đặt skill hoặc plugin đã được chuẩn bị từ một runtime plugin đã tải                         |

### Yêu cầu ghép cặp kênh

Dùng `channel_pairing_requested` khi một plugin cần thông báo cho người vận hành hoặc
ghi bản ghi kiểm toán sau khi người gửi DM chưa được ghép cặp tạo một yêu cầu ghép cặp
đang chờ xử lý. Hook được điều phối khi yêu cầu được tạo; việc kênh chuyển
phản hồi ghép cặp không bị trì hoãn bởi các trình xử lý hook chậm hoặc gặp lỗi.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Yêu cầu ghép cặp ${event.channel} mới từ ${event.senderId}: ${event.code}`,
  });
});
```

Hook này chỉ dùng để theo dõi. Nó không phê duyệt, từ chối, chặn hoặc viết lại
phản hồi ghép cặp. Payload bao gồm kênh, `accountId` tùy chọn,
`senderId` theo phạm vi kênh, `code` ghép cặp và siêu dữ liệu kênh. Hãy coi
mã ghép cặp là thông tin xác thực phê duyệt dùng một lần đang còn hiệu lực và chỉ chuyển mã đó đến một
đích nhận của người vận hành đáng tin cậy. Hãy coi `metadata` là văn bản danh tính
không đáng tin cậy do người gửi cung cấp. Hook không bao gồm nội dung hoặc phương tiện của tin nhắn đến.

## Hook gỡ lỗi runtime

Dùng `before_model_resolve` để chuyển nhà cung cấp hoặc mô hình cho một lượt của agent - hook này
chạy trước khi phân giải mô hình. `llm_output` chỉ chạy sau khi một lần thử mô hình
tạo ra đầu ra của trợ lý.

Để xác minh mô hình phiên thực tế, hãy kiểm tra các đăng ký runtime, sau đó
dùng `openclaw sessions` hoặc các bề mặt phiên/trạng thái của Gateway. Để gỡ lỗi
payload của nhà cung cấp, hãy khởi động Gateway với `--raw-stream` và
`--raw-stream-path <path>` để ghi các sự kiện luồng mô hình thô vào một tệp jsonl.

## Chính sách gọi công cụ

`before_tool_call` nhận:

- `event.toolName`
- `event.params`
- `event.toolKind` và `event.toolInputKind` tùy chọn, các bộ phân biệt có thẩm quyền từ máy chủ
  dành cho những công cụ cố ý dùng chung tên; ví dụ, các lệnh gọi `exec`
  của chế độ mã bên ngoài dùng `toolKind: "code_mode_exec"` và bao gồm
  `toolInputKind: "javascript" | "typescript"` khi ngôn ngữ đầu vào đã
  được xác định
- `event.derivedPaths` tùy chọn, các gợi ý đường dẫn đích được máy chủ suy ra theo nguyên tắc nỗ lực tối đa
  cho các phong bì công cụ phổ biến như `apply_patch`; các đường dẫn này có thể
  không đầy đủ hoặc ước lượng rộng hơn những gì công cụ thực sự sẽ tác động (ví dụ,
  với đầu vào không hợp lệ hoặc chỉ có một phần)
- `event.runId` tùy chọn
- `event.toolCallId` tùy chọn
- các trường ngữ cảnh như `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` và `ctx.trace` chẩn đoán
- `ctx.requester` tùy chọn, bên yêu cầu do máy chủ suy ra đã khởi tạo lần chạy
  tin nhắn hiện tại. Nó có thể bao gồm `channel`, `accountId`, `senderId`,
  `senderIsOwner` và `roleIds` gốc của nhà cung cấp. Các trường bị thiếu là chưa được chứng minh,
  không phải sự bảo đảm rằng giá trị là sai; hãy từ chối theo mặc định khi chính sách yêu cầu các trường đó.

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
- `block: false` được coi là không có quyết định.
- `params` viết lại các tham số công cụ để thực thi.
- `requireApproval` tạm dừng lần chạy agent và hỏi người dùng thông qua cơ chế
  phê duyệt của plugin. `/approve` có thể phê duyệt cả phê duyệt exec và plugin. Trong các
  relay `PreToolUse` gốc ở chế độ báo cáo của app-server Codex, thao tác này chuyển quyền xử lý cho
  yêu cầu phê duyệt app-server tương ứng; xem
  [runtime bộ kiểm thử Codex](/vi/plugins/codex-harness-runtime#hook-boundaries).
- Một `block: true` có mức ưu tiên thấp hơn vẫn có thể chặn sau khi hook có mức ưu tiên cao hơn
  yêu cầu phê duyệt.
- `onResolution` nhận quyết định đã được phân giải: `allow-once`, `allow-always`,
  `deny`, `timeout` hoặc `cancelled`.

### Chính sách nhận biết người gửi trong một tệp

Một tệp plugin độc lập có thể giữ chính sách dành riêng cho việc triển khai trong mã
thay vì thêm một schema cấu hình khác. Ví dụ này cấp cho chủ sở hữu mọi công cụ,
cho phép các bảo trì viên đã cấu hình dùng một tập công cụ và hành động tin nhắn thận trọng,
đồng thời cung cấp `/fix` cho những người gửi đã được cấu hình kênh cấp quyền:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const AGENT_ID = "maintenance-agent";
const MAINTAINER_SCOPES = [
  {
    channel: "discord",
    accountId: "operations",
    senderIds: new Set(["maintainer-user-id"]),
    roleIds: new Set(["maintainer-role-id"]),
  },
];
const MAINTAINER_TOOLS = new Set(["read", "web_fetch", "web_search", "session_status", "message"]);
const MAINTAINER_MESSAGE_ACTIONS = new Set(["react", "reply", "thread-create", "thread-reply"]);

export default definePluginEntry({
  id: "maintenance-access",
  name: "Quyền truy cập bảo trì",
  description: "Áp dụng chính sách công cụ nhận biết người gửi cho agent bảo trì.",
  register(api) {
    api.on("before_tool_call", (event, ctx) => {
      if (ctx.agentId !== AGENT_ID) {
        return;
      }

      const requester = ctx.requester;
      if (requester?.senderIsOwner === true) {
        return;
      }

      const maintainerScope = requester
        ? MAINTAINER_SCOPES.find(
            (scope) =>
              scope.channel === requester.channel && scope.accountId === requester.accountId,
          )
        : undefined;
      const isMaintainer =
        maintainerScope !== undefined &&
        ((requester?.senderId !== undefined && maintainerScope.senderIds.has(requester.senderId)) ||
          requester?.roleIds?.some((roleId) => maintainerScope.roleIds.has(roleId)) === true);
      if (!isMaintainer) {
        return { block: true, blockReason: "Cần quyền truy cập của bảo trì viên." };
      }

      if (event.toolName === "message") {
        const action = typeof event.params.action === "string" ? event.params.action : "";
        if (MAINTAINER_MESSAGE_ACTIONS.has(action)) {
          return;
        }
        return { block: true, blockReason: `Cần quyền chủ sở hữu cho message.${action || "unknown"}.` };
      }

      if (MAINTAINER_TOOLS.has(event.toolName)) {
        return;
      }
      return { block: true, blockReason: `Cần quyền chủ sở hữu cho ${event.toolName}.` };
    });

    api.registerCommand({
      name: "fix",
      description: "Yêu cầu agent bảo trì điều tra và khắc phục một sự cố.",
      acceptsArgs: true,
      requireAuth: true,
      handler: async (ctx) =>
        ctx.agentId === AGENT_ID
          ? { continueAgent: true }
          : { text: "Lệnh này chỉ khả dụng trong cuộc hội thoại bảo trì." },
    });
  },
});
```

Tải trực tiếp tệp và khởi động lại Gateway:

```json5
{
  agents: {
    list: [
      {
        id: "maintenance-agent",
        workspace: "~/.openclaw/workspace-maintenance",
      },
    ],
  },
  bindings: [
    {
      agentId: "maintenance-agent",
      match: {
        channel: "discord",
        accountId: "operations",
        peer: { kind: "channel", id: "maintenance-channel-id" },
      },
    },
  ],
  plugins: {
    load: { paths: ["~/.openclaw/policies/maintenance-access.ts"] },
  },
}
```

`AGENT_ID` phải đặt tên cho agent được liên kết với cuộc hội thoại bảo trì.
Liên kết chọn agent đó cho các tin nhắn thông thường và `/fix`; tệp độc lập
vẫn là chủ sở hữu duy nhất của chính sách công cụ phân biệt chủ sở hữu với bảo trì viên.

`requireAuth: true` tái sử dụng cơ chế tiếp nhận người gửi hiện có của từng kênh. Đối với
Discord, danh sách cho phép `users`/`roles` của máy chủ hoặc kênh có thể cấp quyền cho
đối tượng bảo trì. Các kênh khác có thể dùng id người gửi ổn định. Sau đó, hook
áp dụng quyết định chi tiết hơn theo từng công cụ cho mọi lệnh gọi công cụ trong lần chạy, bao gồm
các lệnh gọi `PreToolUse` gốc của Codex. Nó có thể phủ quyết một công cụ mà mô hình nhìn thấy, nhưng không thể
thêm công cụ bị máy chủ lược bỏ. Các chính sách hiện có về sandbox, phê duyệt exec, công cụ lõi
chỉ dành cho chủ sở hữu và kênh vẫn được áp dụng; hook không thể vượt qua các chính sách đó để cấp quyền.

Hãy giới hạn id người gửi và vai trò trong một cặp kênh/tài khoản chính xác như minh họa; cả hai đều là
không gian tên cục bộ của nhà cung cấp. Duy trì danh sách cho phép một cách thận trọng. Chỉ thêm các công cụ
ghi hoặc thực thi khi chính sách sandbox và phê duyệt của việc triển khai bảo đảm an toàn.
Đối với các lần chạy tự động hoặc hệ thống, hãy quyết định rõ liệu việc thiếu
`ctx.requester` có được phép tiếp tục hay không; ví dụ này từ chối trường hợp đó đối với agent có phạm vi áp dụng.

Xem [Yêu cầu quyền của plugin](/vi/plugins/plugin-permission-requests) để biết
cách định tuyến phê duyệt, hành vi quyết định và khi nào nên dùng `requireApproval` thay
cho công cụ tùy chọn hoặc phê duyệt exec.

Các plugin cần chính sách cấp máy chủ có thể đăng ký chính sách công cụ đáng tin cậy bằng
`api.registerTrustedToolPolicy(...)`. Các chính sách này chạy trước các hook
`before_tool_call` thông thường và trước các quyết định hook thông thường. Các chính sách đáng tin cậy
được đóng gói chạy trước; các chính sách đáng tin cậy của plugin đã cài đặt chạy tiếp theo thứ tự tải
plugin; các hook `before_tool_call` thông thường chạy sau chúng. Các plugin được đóng gói giữ
đường dẫn chính sách đáng tin cậy hiện có. Các plugin đã cài đặt phải được bật rõ ràng
và khai báo mọi id chính sách trong `contracts.trustedToolPolicies`; các id chưa khai báo
bị từ chối trước khi đăng ký. Id chính sách được giới hạn trong phạm vi plugin đăng ký,
vì vậy các plugin khác nhau có thể tái sử dụng cùng một id cục bộ. Chỉ dùng tầng này
cho các cổng kiểm soát được máy chủ tin cậy như chính sách workspace, thực thi ngân sách hoặc
an toàn của quy trình công việc dành riêng.

### Hook môi trường exec

`resolve_exec_env` cho phép các plugin bổ sung biến môi trường vào các lần gọi công cụ `exec`
trước khi lệnh chạy. Hook này nhận:

- `event.sessionKey`
- `event.toolName`, hiện luôn là `"exec"`
- `event.host`, một trong `"gateway"`, `"sandbox"` hoặc `"node"`
- các trường ngữ cảnh như `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` và `ctx.channelId`

Trả về một `Record<string, string>` để hợp nhất vào môi trường exec. Các trình xử lý
chạy theo thứ tự ưu tiên; với cùng một khóa, kết quả sau sẽ ghi đè kết quả
trước.

Đầu ra của hook được lọc qua chính sách khóa môi trường exec của máy chủ trước khi
hợp nhất. `PATH` luôn bị loại bỏ (việc phân giải lệnh và kiểm tra tệp nhị phân an toàn
phụ thuộc vào biến này). Các khóa không hợp lệ và khóa ghi đè máy chủ nguy hiểm như `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, các biến proxy (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) và các biến ghi đè TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` và tương tự) đều bị loại bỏ. Môi trường plugin đã lọc được đưa vào
siêu dữ liệu phê duyệt/kiểm toán của Gateway và chuyển tiếp đến các yêu cầu thực thi
trên máy chủ Node.

### Lưu trữ lâu dài kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để kết xuất giao diện người dùng, chẩn đoán,
định tuyến phương tiện hoặc siêu dữ liệu do plugin sở hữu. Xem `details` là siêu dữ liệu thời gian chạy,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi phát lại cho nhà cung cấp và đưa vào dữ liệu
  Compaction để siêu dữ liệu không trở thành ngữ cảnh mô hình.
- Các mục phiên được lưu trữ chỉ giữ lại `details` có giới hạn. Chi tiết quá lớn được
  thay thế bằng bản tóm tắt ngắn gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn
  lưu trữ cuối cùng. Giữ `details` được trả về ở kích thước nhỏ và tránh đặt
  văn bản liên quan đến prompt chỉ trong `details`; hãy đặt đầu ra công cụ mà mô hình có thể thấy trong
  `content`.

## Hook prompt và mô hình

Sử dụng các hook theo từng giai đoạn cho plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và siêu dữ liệu
  tệp đính kèm. Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, các thông điệp phiên đã
  chuẩn bị và mọi nội dung chèn chỉ-một-lần trong hàng đợi đã được lấy ra cho phiên này.
  Trả về `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và các thông điệp phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho các lượt Heartbeat và trả về
  `prependContext` hoặc `appendContext`. Dành cho các trình giám sát nền cần
  tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_run` chạy sau khi xây dựng prompt và trước mọi đầu vào mô hình,
bao gồm việc tải hình ảnh cục bộ của prompt và quan sát `llm_input`. Hook này nhận
đầu vào người dùng hiện tại dưới dạng `prompt`, cùng lịch sử phiên đã tải trong `messages`
và prompt hệ thống đang hoạt động. Trả về `{ outcome: "block", reason, message? }`
để dừng lượt chạy trước khi mô hình đọc prompt. `reason` là nội bộ;
`message` là nội dung thay thế dành cho người dùng. Chỉ hỗ trợ kết quả `pass` và `block`;
các dạng quyết định không được hỗ trợ sẽ đóng theo hướng an toàn.

Khi một lượt chạy bị chặn, OpenClaw chỉ lưu văn bản thay thế trong
`message.content` cùng siêu dữ liệu chặn không nhạy cảm như mã định danh
plugin chặn và dấu thời gian. Văn bản gốc của người dùng không được giữ lại trong bản chép lời
hoặc ngữ cảnh tương lai. Các lý do chặn nội bộ được xem là nhạy cảm và
bị loại khỏi tải trọng bản chép lời, lịch sử, phát rộng, nhật ký và chẩn đoán.
Khả năng quan sát nên sử dụng các trường đã làm sạch như mã định danh trình chặn, kết quả,
dấu thời gian hoặc một danh mục an toàn.

Các hook lượt tác nhân, bao gồm `agent_end`, có `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động; cùng giá trị này cũng có trên `ctx.runId`. Các lượt chạy do Cron điều khiển
cũng cung cấp `ctx.jobId` (mã định danh tác vụ cron khởi nguồn) trong ngữ cảnh lượt tác nhân
để hook có thể giới hạn phạm vi số liệu, hiệu ứng phụ hoặc trạng thái vào một
tác vụ đã lên lịch cụ thể. `ctx.jobId` không thuộc ngữ cảnh công cụ `before_tool_call`.

Đối với các lượt bắt nguồn từ kênh, `ctx.channel` và `ctx.messageProvider` xác định
bề mặt nhà cung cấp như `discord` hoặc `telegram`, còn `ctx.channelId` là
mã định danh đích hội thoại khi OpenClaw có thể suy ra từ khóa phiên
hoặc siêu dữ liệu phân phối.

Khi có danh tính người gửi, ngữ cảnh hook tác nhân cũng bao gồm:

- `ctx.senderId` - mã định danh người gửi trong phạm vi kênh (ví dụ: `open_id` của Feishu, mã định danh
  người dùng Discord). Được điền khi lượt chạy bắt nguồn từ thông điệp của người dùng có
  siêu dữ liệu người gửi đã biết.
- `ctx.chatId` - mã định danh hội thoại nguyên bản của tầng vận chuyển (ví dụ: `chat_id`
  của Feishu, `chat_id` của Telegram). Được điền khi kênh khởi nguồn
  cung cấp mã định danh hội thoại nguyên bản.
- `ctx.channelContext.sender.id` - cùng mã định danh người gửi với `ctx.senderId`, nằm trong
  một đối tượng do kênh sở hữu mà plugin có thể mở rộng bằng các trường dành riêng cho kênh.
- `ctx.channelContext.chat.id` - cùng mã định danh hội thoại với `ctx.chatId`,
  nằm trong một đối tượng do kênh sở hữu mà plugin có thể mở rộng bằng các trường dành riêng
  cho kênh.

Core chỉ định nghĩa các trường `id` lồng nhau. Plugin kênh chuyển tiếp siêu dữ liệu
người gửi hoặc cuộc trò chuyện phong phú hơn qua trình trợ giúp đầu vào có thể bổ sung
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

Plugin kênh chuyển các trường đó qua trình trợ giúp SDK đầu vào:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Các trường này là tùy chọn và không có trong các lượt chạy bắt nguồn từ hệ thống (Heartbeat,
cron, sự kiện exec).

`ctx.senderExternalId` vẫn được giữ dưới dạng trường tương thích mã nguồn đã lỗi thời cho
các plugin cũ. Core không điền trường này; danh tính người gửi mới dành riêng cho kênh
nên nằm trong `ctx.channelContext.sender` thông qua phần
bổ sung mô-đun.

`agent_end` là một hook quan sát. Các đường dẫn Gateway và harness lưu trữ lâu dài chạy
hook này theo kiểu kích hoạt rồi bỏ qua sau lượt, còn các đường dẫn CLI dùng một lần, tồn tại ngắn sẽ chờ
promise của hook trước khi dọn dẹp tiến trình để các plugin đáng tin cậy có thể đẩy hết
dữ liệu quan sát đầu cuối hoặc chụp trạng thái. Trình chạy hook áp dụng thời gian chờ 30 giây
để một plugin bị treo hoặc điểm cuối nhúng không thể khiến promise của hook
chờ mãi mãi. Sự kiện hết thời gian chờ được ghi nhật ký và OpenClaw tiếp tục; hệ thống không
hủy công việc mạng do plugin sở hữu trừ khi plugin cũng sử dụng tín hiệu hủy
riêng.

Sử dụng `model_call_started` và `model_call_ended` cho dữ liệu đo từ xa của lệnh gọi nhà cung cấp
không được nhận prompt thô, lịch sử, phản hồi, tiêu đề, nội dung
yêu cầu hoặc mã định danh yêu cầu của nhà cung cấp. Các hook này bao gồm siêu dữ liệu ổn định như
`runId`, `callId`, `provider`, `model`, `api`/`transport` tùy chọn, trạng thái cuối
`durationMs`/`outcome` và `upstreamRequestIdHash` khi OpenClaw có thể suy ra một
hàm băm mã định danh yêu cầu của nhà cung cấp có giới hạn. Khi thời gian chạy đã phân giải
siêu dữ liệu cửa sổ ngữ cảnh, sự kiện và ngữ cảnh hook cũng bao gồm
`contextTokenBudget`, ngân sách token hiệu dụng sau các giới hạn của mô hình/cấu hình/tác nhân,
cùng `contextWindowSource` và `contextWindowReferenceTokens` khi một
giới hạn thấp hơn được áp dụng.

`before_agent_finalize` chỉ chạy khi một harness sắp chấp nhận câu trả lời tự nhiên
cuối cùng của trợ lý. Đây không phải đường dẫn hủy `/stop` và không
chạy khi người dùng hủy một lượt. Trả về `{ action: "revise", reason }` để yêu cầu
harness thực hiện thêm một lượt mô hình trước khi hoàn tất, `{ action:
"finalize", reason? }` để buộc hoàn tất hoặc bỏ qua kết quả để tiếp tục.
Các trình xử lý có ngân sách mặc định là 15 giây; khi hết thời gian chờ, OpenClaw ghi nhật ký lỗi và
tiếp tục với câu trả lời cuối cùng ban đầu.
Các hook `Stop` nguyên bản của Codex được chuyển tiếp vào hook này dưới dạng các quyết định
`before_agent_finalize` của OpenClaw.

Khi trả về `action: "revise"`, plugin có thể bao gồm siêu dữ liệu `retry` để
đảm bảo lượt mô hình bổ sung có giới hạn và an toàn khi phát lại:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` được nối vào lý do sửa đổi gửi đến harness.
`idempotencyKey` cho phép máy chủ đếm số lần thử lại cho cùng một yêu cầu plugin
trên các quyết định hoàn tất tương đương, còn `maxAttempts` giới hạn số lượt bổ sung
mà máy chủ cho phép trước khi tiếp tục với câu trả lời cuối cùng tự nhiên.

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

Có thể vô hiệu hóa theo từng plugin các hook làm thay đổi prompt và nội dung chèn bền vững cho lượt
tiếp theo bằng `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Phần mở rộng phiên và nội dung chèn cho lượt tiếp theo

Plugin quy trình làm việc có thể lưu trữ trạng thái phiên nhỏ, tương thích JSON bằng
`api.session.state.registerSessionExtension(...)` và cập nhật trạng thái đó thông qua
phương thức Gateway `sessions.pluginPatch`. Các hàng phiên chiếu trạng thái phần mở rộng
đã đăng ký qua `pluginExtensions`, cho phép Control UI và các
máy khách khác kết xuất trạng thái do plugin sở hữu mà không cần biết chi tiết nội bộ của plugin.
`api.registerSessionExtension(...)` vẫn hoạt động nhưng đã lỗi thời; nên dùng
không gian tên `api.session.state`.

Sử dụng `api.session.workflow.enqueueNextTurnInjection(...)` khi plugin cần
ngữ cảnh bền vững đến đúng một lần trong lượt mô hình tiếp theo (`api.enqueueNextTurnInjection(...)`
cấp cao nhất là bí danh đã lỗi thời nhưng có cùng hành vi). OpenClaw lấy các nội dung chèn
trong hàng đợi ra trước hook prompt, loại bỏ nội dung chèn hết hạn và loại bỏ trùng lặp theo
`idempotencyKey` cho từng plugin. Đây là điểm nối phù hợp cho việc tiếp tục sau phê duyệt,
tóm tắt chính sách, phần thay đổi của trình giám sát nền và phần tiếp nối lệnh cần hiển thị
cho mô hình ở lượt tiếp theo nhưng không được trở thành văn bản prompt hệ thống vĩnh viễn.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Các lệnh gọi lại dọn dẹp phần mở rộng phiên và
vòng đời thời gian chạy nhận `reset`, `delete`, `disable` hoặc
`restart`. Máy chủ xóa trạng thái phần mở rộng phiên lưu trữ lâu dài
và các nội dung chèn đang chờ cho lượt tiếp theo của plugin sở hữu khi đặt lại/xóa/vô hiệu hóa; khi khởi động lại,
trạng thái phiên bền vững được giữ nguyên, còn các lệnh gọi lại dọn dẹp cho phép plugin giải phóng
tác vụ của bộ lập lịch, ngữ cảnh chạy và các tài nguyên ngoài luồng khác của thế hệ
thời gian chạy cũ.

## Hook thông điệp

Sử dụng hook thông điệp cho chính sách định tuyến và phân phối cấp kênh:

- `message_received`: quan sát nội dung đầu vào, người gửi, `threadId`,
  `messageId`, `senderId`, tương quan lượt chạy/phiên tùy chọn và siêu dữ liệu.
- `message_sending`: viết lại `content` hoặc trả về `{ cancel: true }`.
- `reply_payload_sending`: viết lại các đối tượng `ReplyPayload` đã chuẩn hóa
  (bao gồm `presentation`, `delivery`, tham chiếu phương tiện và văn bản) hoặc trả về
  `{ cancel: true }`.
- `message_sent`: quan sát trạng thái thành công hoặc thất bại cuối cùng.

Đối với phản hồi TTS chỉ có âm thanh, `content` có thể chứa bản chép lời nói
ẩn ngay cả khi tải trọng kênh không có văn bản/chú thích hiển thị.
Việc viết lại `content` đó chỉ cập nhật bản chép lời mà hook có thể thấy; nội dung này không được
kết xuất dưới dạng chú thích phương tiện.

Các sự kiện `reply_payload_sending` có thể bao gồm `usageState`, một ảnh chụp nhanh trực tiếp,
theo từng lượt và theo nỗ lực tốt nhất về mô hình/mức sử dụng/ngữ cảnh. Hoạt động phân phối bền vững, phát lại đã khôi phục và
các phản hồi không có tương quan lượt chạy chính xác sẽ không bao gồm trường này.

Ngữ cảnh hook thông báo cung cấp các trường tương quan ổn định khi có sẵn:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` và `ctx.callDepth`. Ngữ cảnh gửi đến
và `before_dispatch` cũng cung cấp siêu dữ liệu phản hồi khi kênh
có dữ liệu thông báo được trích dẫn đã lọc theo phạm vi hiển thị: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` và `replyToIsQuote`. Ưu tiên các trường
hạng nhất này trước khi đọc siêu dữ liệu cũ.

Ưu tiên các trường `threadId` và `replyToId` có kiểu trước khi sử dụng siêu dữ liệu
dành riêng cho kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là trạng thái kết thúc.
- `message_sending` với `cancel: false` được coi là không có quyết định.
- `content` đã được viết lại tiếp tục đến các hook có mức ưu tiên thấp hơn, trừ khi một hook sau đó
  hủy việc phân phối.
- `reply_payload_sending` chạy sau khi chuẩn hóa tải trọng và trước khi phân phối qua
  kênh, bao gồm cả các phản hồi được định tuyến trở lại kênh ban đầu.
  Các trình xử lý chạy tuần tự và mỗi trình xử lý thấy tải trọng mới nhất do
  các trình xử lý có mức ưu tiên cao hơn tạo ra.
- Tải trọng `reply_payload_sending` không cung cấp các dấu hiệu tin cậy khi chạy như
  `trustedLocalMedia`; plugin có thể chỉnh sửa cấu trúc tải trọng nhưng không thể cấp quyền tin cậy
  cho phương tiện cục bộ.
- `message_sending` có thể trả về `cancelReason` và `metadata` có giới hạn cùng với thao tác
  hủy. Các API vòng đời thông báo mới cung cấp điều này dưới dạng kết quả
  phân phối bị chặn với lý do `cancelled_by_message_sending_hook`; cơ chế
  phân phối trực tiếp cũ vẫn trả về một mảng kết quả rỗng để đảm bảo khả năng tương thích.
- `message_sent` chỉ dùng để quan sát. Lỗi trình xử lý được ghi nhật ký và không
  thay đổi kết quả phân phối.

## Cài đặt hook

Sử dụng `security.installPolicy` cho các quyết định cho phép/chặn do người vận hành sở hữu. Chính sách đó
chạy từ cấu hình OpenClaw, áp dụng cho các đường dẫn cài đặt và cập nhật CLI, đồng thời
từ chối theo mặc định khi được bật nhưng không khả dụng.

`before_install` là một hook vòng đời của môi trường chạy plugin. Hook này chạy sau
`security.installPolicy` chỉ trong tiến trình OpenClaw nơi các hook plugin
đã được tải, chẳng hạn như các luồng cài đặt dựa trên Gateway. Hook này hữu ích cho
các hoạt động quan sát, cảnh báo và kiểm tra khả năng tương thích do plugin sở hữu, nhưng không phải là
ranh giới bảo mật chính của doanh nghiệp hoặc máy chủ đối với việc cài đặt. Trường
`builtinScan` vẫn nằm trong tải trọng sự kiện để đảm bảo khả năng tương thích, nhưng
OpenClaw không còn chạy cơ chế chặn mã nguy hiểm tích hợp sẵn tại thời điểm cài đặt, vì vậy đây
là một kết quả `ok` rỗng. Trả về các phát hiện bổ sung hoặc
`{ block: true, blockReason }` để dừng quá trình cài đặt trong tiến trình đó.

`block: true` là trạng thái kết thúc. `block: false` được coi là không có quyết định. Lỗi trình xử lý
chặn quá trình cài đặt theo cơ chế từ chối mặc định.

## Vòng đời Gateway

Sử dụng `gateway_start` để khởi động các dịch vụ plugin chung và `gateway_stop` để
dọn dẹp các tài nguyên chạy lâu dài. Bộ lập lịch cron có thể vẫn đang tải khi
`gateway_start` chạy, vì vậy không sử dụng hook này làm tín hiệu cơ sở cho phép chiếu
cron bên ngoài.

Không dựa vào hook nội bộ `gateway:startup` cho các dịch vụ khi chạy
do plugin sở hữu.

`cron_reconciled` được kích hoạt sau khi bộ lập lịch cron của Gateway và các trình theo dõi
khi thoát đã đối soát trạng thái bền vững của chúng. Hook này được kích hoạt cho cả lần
khởi động ban đầu và khi thay thế bộ lập lịch trong quá trình tải lại cấu hình. Sự kiện báo cáo
`reason` (`startup` hoặc `reload`) và trạng thái `enabled` có hiệu lực. Cron bị tắt
vẫn phát sự kiện với `enabled: false`, cho phép một phép chiếu bên ngoài
xóa các lần đánh thức cũ. Sử dụng `ctx.getCron?.()` cho đúng phiên bản bộ lập lịch đã
hoàn tất đối soát; lần tải lại sau đó không chuyển đích gọi lại đó.
`ctx.abortSignal` sở hữu cùng ảnh chụp nhanh bộ lập lịch đó. Gateway hủy tín hiệu này ngay
khi một bộ lập lịch mới hơn được kích hoạt hoặc quá trình tắt bắt đầu. Truyền tín hiệu này qua mọi
tác dụng phụ bền vững và không chấp nhận ảnh chụp nhanh sau khi tín hiệu bị hủy.
Đây là tín hiệu vòng đời bộ lập lịch, không phải tín hiệu kích hoạt plugin:
việc tải lại nóng chỉ dành cho plugin không phát lại tín hiệu này. Một trình tiêu thụ mới được bật nhận
đường cơ sở đầu tiên khi bộ lập lịch được thay thế lần tiếp theo hoặc khi Gateway khởi động.

Giống như các hook quan sát khác, các lệnh gọi lại `gateway_start` và `cron_reconciled`
có thể chồng lấn. Nếu cả hai trình xử lý dùng chung quá trình khởi tạo plugin, hãy phối hợp chúng
bằng một promise sẵn sàng cục bộ của plugin thay vì phụ thuộc vào thứ tự gọi lại.

`cron_changed` được kích hoạt cho các sự kiện vòng đời cron do Gateway sở hữu với tải trọng
sự kiện có kiểu bao gồm các lý do `added`, `updated`, `removed`, `started`, `finished`
và `scheduled`. Sự kiện mang theo một ảnh chụp nhanh `PluginHookGatewayCronJob`
(bao gồm `state.nextRunAtMs`, `state.lastRunStatus` và
`state.lastError` khi có) cùng với một `PluginHookGatewayCronDeliveryStatus`
thuộc `not-requested` | `delivered` | `not-delivered` | `unknown`. Các sự kiện đã xóa
diễn ra sau khi cam kết: chúng chỉ được kích hoạt sau khi xóa bền vững thành công và vẫn mang theo
ảnh chụp nhanh tác vụ đã xóa để các bộ lập lịch bên ngoài có thể đối soát trạng thái.

Sự kiện `scheduled` diễn ra sau khi cam kết: sự kiện này chỉ được kích hoạt sau khi một thao tác ghi bền vững
thành công thay đổi `nextRunAtMs` có hiệu lực của một tác vụ hiện có, không bao gồm sự kiện vòng đời
`added`, `updated` hoặc `removed` tường minh của tác vụ đó. `event.nextRunAtMs`
cấp cao nhất là lần đánh thức tiếp theo đã được cam kết; khi không có trường này, tác vụ
không có lần đánh thức tiếp theo. Hãy xem các sự kiện này là gợi ý đối soát, không phải nhật ký
chênh lệch có thứ tự. Sử dụng chúng làm các gợi ý có thể hợp nhất để đọc lại bộ lập lịch được
`cron_reconciled` ghi nhận gần nhất; không tiếp nhận bộ lập lịch từ ngữ cảnh `cron_changed`.
Giữ OpenClaw làm nguồn dữ liệu chính xác cho việc kiểm tra đến hạn và thực thi.

### Phép chiếu cron bên ngoài an toàn

Chiếu một ảnh chụp nhanh đánh thức hoàn chỉnh thay vì chuyển tiếp các chênh lệch sự kiện cron. Thao tác
`replaceAll` của bộ điều hợp bên ngoài phải có tính nguyên tử và lũy đẳng, đồng thời
chỉ được hoàn tất sau khi máy chủ đã chấp nhận ảnh chụp nhanh một cách bền vững. Thao tác này
cũng phải tuân thủ tín hiệu hủy được cung cấp: nếu tín hiệu bị hủy trước khi
chấp nhận bền vững, bộ điều hợp không được chấp nhận ảnh chụp nhanh đó.

Mẫu này chỉ duy trì một worker trạng thái mới nhất đang hoạt động. Chỉ `cron_reconciled`
tiếp nhận một phiên bản bộ lập lịch; `cron_changed` chỉ yêu cầu worker đó đọc lại
phiên bản có thẩm quyền, do đó một gợi ý đến muộn không thể khôi phục bộ lập lịch cũ hơn.
Một phiên bản sửa đổi mới hơn hủy lần thử máy chủ đang hoạt động trước khi nó có thể chấp nhận một
ảnh chụp nhanh cũ.

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
        api.logger.warn(`phép chiếu cron bên ngoài thất bại; sẽ thử lại sau ${retryMs}ms`);
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
      api.logger.warn("quá trình đối soát cron không cung cấp bộ lập lịch");
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

Khi `cron_reconciled` báo cáo `enabled: false`, cùng đường dẫn đó gọi
`replaceAll([])` và xóa các lần đánh thức bên ngoài cũ. Cơ chế thử lại/chờ lũy tiến trong ví dụ này
là cục bộ theo tiến trình và coi lỗi bộ điều hợp khi chạy là tạm thời; hãy xác thực
cấu hình không thể thử lại trước khi đăng ký. OpenClaw không cung cấp
hộp thư đi cho các tác dụng của hook plugin. Nếu tiến trình thoát trước khi được chấp nhận bền vững,
lần khởi động Gateway tiếp theo sẽ phát một ảnh chụp nhanh `cron_reconciled` mới có thẩm quyền.
`gateway_stop` hủy công việc máy chủ đang thực hiện, chờ worker ổn định, sau đó
đóng bộ điều hợp.

## Các tính năng sắp ngừng hỗ trợ

Một vài bề mặt liền kề hook đã không còn được khuyến nghị nhưng vẫn được hỗ trợ. Hãy di chuyển
trước bản phát hành chính tiếp theo:

- **Phong bì kênh dạng văn bản thuần** trong các trình xử lý `inbound_claim` và `message_received`.
  Hãy đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc
  thay vì phân tích văn bản phong bì phẳng. Xem
  [Phong bì kênh dạng văn bản thuần → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`subagent_spawning`** vẫn được giữ để tương thích với các plugin cũ, nhưng
  plugin mới không nên trả về thông tin định tuyến luồng từ đó. Core chuẩn bị
  các liên kết subagent `thread: true` thông qua bộ điều hợp liên kết phiên kênh
  trước khi `subagent_spawned` được kích hoạt.
- **`deactivate`** vẫn được giữ làm bí danh tương thích dọn dẹp đã lỗi thời cho đến
  sau ngày 2026-08-16. Plugin mới nên sử dụng `gateway_stop`.
- **`onResolution` trong `before_tool_call`** hiện sử dụng hợp
  `PluginApprovalResolution` có định kiểu (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) thay cho `string` dạng tự do.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** vẫn được giữ
  làm bí danh tương thích cấp cao nhất. Plugin mới nên sử dụng
  `api.session.state.registerSessionExtension(...)` và
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Để xem danh sách đầy đủ — đăng ký khả năng bộ nhớ, hồ sơ suy luận của nhà cung cấp,
nhà cung cấp xác thực bên ngoài, kiểu khám phá nhà cung cấp, bộ truy cập môi trường chạy
tác vụ và việc đổi tên `command-auth` → `command-status` — hãy xem
[Di chuyển Plugin SDK → Các tính năng đã lỗi thời đang hoạt động](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Di chuyển Plugin SDK](/vi/plugins/sdk-migration) - các tính năng đã lỗi thời đang hoạt động và lịch trình loại bỏ
- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tổng quan về Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào của plugin](/vi/plugins/sdk-entrypoints)
- [Hook nội bộ](/vi/automation/hooks)
- [Chi tiết nội bộ về kiến trúc plugin](/vi/plugins/architecture-internals)
