---
read_when:
    - Bạn cần một hook hoặc công cụ Plugin để hỏi trước khi một tác động phụ chạy
    - Bạn cần cấu hình nơi gửi lời nhắc phê duyệt Plugin
    - Bạn đang quyết định giữa các công cụ tùy chọn, phê duyệt thực thi và phê duyệt plugin
sidebarTitle: Permission requests
summary: Yêu cầu người dùng phê duyệt các lệnh gọi công cụ Plugin và lời nhắc quyền do Plugin sở hữu
title: Yêu cầu quyền của Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Yêu cầu quyền của Plugin cho phép mã Plugin tạm dừng một lệnh gọi công cụ hoặc thao tác do Plugin sở hữu cho đến khi người dùng phê duyệt hoặc từ chối. Chúng dùng luồng Gateway `plugin.approval.*` và cùng các bề mặt UI phê duyệt xử lý nút phê duyệt trong chat và lệnh `/approve`.

Dùng yêu cầu quyền của Plugin cho quyền của Plugin/ứng dụng. Chúng không thay thế phê duyệt exec của máy chủ, danh sách cho phép công cụ tùy chọn, hoặc quy trình xem xét quyền gốc của Codex.

## Chọn cổng kiểm soát phù hợp

Chọn cổng kiểm soát khớp với điểm quyết định bạn cần:

| Cổng kiểm soát                  | Dùng khi                                                                  | Nội dung kiểm soát                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Công cụ tùy chọn                | Một công cụ không nên hiển thị với mô hình cho đến khi người dùng chọn tham gia. | Việc hiển thị công cụ thông qua `tools.allow`.                                                                          |
| Yêu cầu quyền của Plugin        | Một hook Plugin hoặc thao tác do Plugin sở hữu phải hỏi trước khi chạy một hành động. | Phê duyệt trong runtime thông qua `plugin.approval.*`.                                                                  |
| Phê duyệt exec                  | Một lệnh máy chủ hoặc công cụ giống shell cần phê duyệt của người vận hành. | Chính sách exec của máy chủ và danh sách cho phép exec bền vững.                                                        |
| Yêu cầu quyền gốc của Codex     | Codex hỏi trước các hành động shell, tệp, MCP hoặc app-server gốc.        | Xử lý phê duyệt app-server hoặc hook gốc của Codex, được định tuyến qua phê duyệt Plugin khi OpenClaw sở hữu lời nhắc. |
| Lời gợi yêu cầu phê duyệt MCP   | Một máy chủ MCP của Codex yêu cầu phê duyệt cho một lệnh gọi công cụ.     | Phản hồi phê duyệt MCP được bắc cầu qua phê duyệt Plugin của OpenClaw.                                                   |

Công cụ tùy chọn là cổng kiểm soát tại thời điểm khám phá. Yêu cầu quyền của Plugin là cổng kiểm soát theo từng lệnh gọi. Dùng cả hai khi một công cụ nhạy cảm cần người dùng chọn tham gia rõ ràng trước khi mô hình có thể thấy nó và cần phê duyệt trước khi hành động chạy.

## Yêu cầu phê duyệt trước một lệnh gọi công cụ

Hầu hết lời nhắc do Plugin tạo nên bắt đầu trong hook `before_tool_call`. Hook chạy sau khi mô hình chọn một công cụ và trước khi OpenClaw thực thi công cụ đó:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Viết nội dung lời nhắc cho người sẽ phê duyệt hành động:

- Giữ `title` ngắn và tập trung vào hành động. Gateway chấp nhận tối đa 80 ký tự.
- Giữ `description` cụ thể và có giới hạn rõ ràng. Gateway chấp nhận tối đa 256 ký tự.
- Bao gồm hành động, mục tiêu và rủi ro. Không bao gồm bí mật, token hoặc payload riêng tư không nên xuất hiện trên các bề mặt phê duyệt trong chat.
- Chỉ dùng `severity: "critical"` cho các hành động mà quyết định sai có thể gây hư hại production hoặc mất dữ liệu.
- Dùng `allowedDecisions: ["allow-once", "deny"]` khi việc tin cậy bền vững không an toàn cho hành động đó.

## Hành vi quyết định

OpenClaw tạo một phê duyệt đang chờ với ID `plugin:`, gửi nó đến các bề mặt phê duyệt có sẵn và chờ quyết định.

| Quyết định       | Kết quả                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| `allow-once`     | Lệnh gọi hiện tại tiếp tục.                                                |
| `allow-always`   | Lệnh gọi hiện tại tiếp tục và quyết định được chuyển cho Plugin.           |
| `deny`           | Lệnh gọi bị chặn với kết quả công cụ bị từ chối.                           |
| Hết thời gian    | Lệnh gọi bị chặn trừ khi `timeoutBehavior` là `"allow"`.                   |
| Hủy              | Lệnh gọi bị chặn khi lượt chạy bị hủy bỏ.                                  |
| Không có tuyến phê duyệt | Lệnh gọi bị chặn vì không có bề mặt phê duyệt đã kết nối nào có thể xử lý nó. |

`allow-always` chỉ bền vững khi Plugin hoặc runtime yêu cầu triển khai việc lưu bền vững đó. Với các hook `before_tool_call.requireApproval` thông thường, OpenClaw coi `allow-once` và `allow-always` là quyết định phê duyệt cho lệnh gọi hiện tại và chuyển giá trị đã xử lý cho `onResolution`. Nếu Plugin của bạn cung cấp `allow-always`, hãy ghi tài liệu và triển khai chính xác những lệnh gọi tương lai mà nó tin cậy.

Nếu hook cũng trả về `params`, OpenClaw chỉ áp dụng các thay đổi tham số đó sau khi phê duyệt thành công. Một hook có độ ưu tiên thấp hơn vẫn có thể chặn sau khi một hook có độ ưu tiên cao hơn đã yêu cầu phê duyệt.

`allowedDecisions` giới hạn các nút và lệnh hiển thị cho người dùng. Gateway từ chối nỗ lực xử lý cho bất kỳ quyết định nào mà yêu cầu không cung cấp.

## Định tuyến lời nhắc phê duyệt

Lời nhắc phê duyệt có thể được xử lý trong các bề mặt UI cục bộ hoặc trong các kênh chat hỗ trợ xử lý phê duyệt. Để chuyển tiếp lời nhắc phê duyệt Plugin đến các mục tiêu chat rõ ràng, hãy cấu hình `approvals.plugin`:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` độc lập với `approvals.exec`. Bật chuyển tiếp phê duyệt exec không định tuyến lời nhắc phê duyệt Plugin, và bật chuyển tiếp phê duyệt Plugin không thay đổi chính sách exec của máy chủ.

Khi lời nhắc bao gồm văn bản phê duyệt thủ công, hãy xử lý nó bằng một trong các quyết định được cung cấp:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Xem [Phê duyệt exec nâng cao](/vi/tools/exec-approvals-advanced#plugin-approval-forwarding) để biết mô hình chuyển tiếp đầy đủ, hành vi phê duyệt trong cùng chat, phân phối kênh gốc và quy tắc người phê duyệt theo từng kênh.

## Quyền gốc của Codex

Lời nhắc quyền gốc của Codex cũng có thể đi qua phê duyệt Plugin, nhưng chúng có quyền sở hữu khác với hook do Plugin tạo.

- Yêu cầu phê duyệt app-server của Codex được định tuyến qua OpenClaw sau khi Codex xem xét.
- Relay hook gốc `permission_request` có thể hỏi thông qua `plugin.approval.request` khi relay đó được bật.
- Lời gợi yêu cầu phê duyệt công cụ MCP được định tuyến qua phê duyệt Plugin khi Codex đánh dấu `_meta.codex_approval_kind` là `"mcp_tool_call"`.

Xem [Runtime harness Codex](/vi/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) để biết hành vi riêng của Codex và quy tắc dự phòng.

## Khắc phục sự cố

**Công cụ báo phê duyệt Plugin không khả dụng.** Không có UI phê duyệt hoặc tuyến phê duyệt đã cấu hình nào chấp nhận yêu cầu. Kết nối một client có khả năng phê duyệt, dùng một kênh hỗ trợ `/approve` trong cùng chat, hoặc cấu hình `approvals.plugin`.

**`allow-always` xuất hiện nhưng lệnh gọi tiếp theo lại nhắc lần nữa.** Luồng phê duyệt Plugin chung không tự động lưu bền vững tin cậy cho các hook tùy ý. Lưu bền vững tin cậy do Plugin sở hữu trong Plugin của bạn sau `onResolution("allow-always")`, hoặc chỉ cung cấp `allow-once` và `deny`.

**`/approve` từ chối quyết định.** Yêu cầu đã giới hạn `allowedDecisions`. Dùng một trong các quyết định được in trong lời nhắc.

**Lời nhắc Slack, Discord, Telegram hoặc Matrix được định tuyến khác với phê duyệt exec.** Phê duyệt Plugin và phê duyệt exec dùng cấu hình riêng và có thể dùng các kiểm tra ủy quyền khác nhau. Xác minh `approvals.plugin` và hỗ trợ phê duyệt Plugin của kênh thay vì chỉ kiểm tra `approvals.exec`.

## Liên quan

- [Hook Plugin](/vi/plugins/hooks#tool-call-policy)
- [Xây dựng Plugin](/vi/plugins/building-plugins#registering-agent-tools)
- [Phê duyệt exec nâng cao](/vi/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Giao thức Gateway](/vi/gateway/protocol)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
