---
read_when:
    - Bạn cần một hook Plugin hoặc công cụ để yêu cầu xác nhận trước khi một tác dụng phụ được thực thi
    - Bạn cần cấu hình nơi gửi các lời nhắc phê duyệt plugin
    - Bạn đang lựa chọn giữa các công cụ tùy chọn, phê duyệt thực thi và phê duyệt Plugin
sidebarTitle: Permission requests
summary: Yêu cầu người dùng phê duyệt các lệnh gọi công cụ của plugin và các lời nhắc cấp quyền do plugin sở hữu
title: Yêu cầu quyền của Plugin
x-i18n:
    generated_at: "2026-07-16T14:45:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Yêu cầu quyền của Plugin cho phép mã Plugin tạm dừng một lệnh gọi công cụ hoặc thao tác
do Plugin sở hữu cho đến khi người dùng chấp thuận hoặc từ chối. Chúng sử dụng luồng Gateway
`plugin.approval.*` và cùng các bề mặt giao diện người dùng phê duyệt xử lý các nút
phê duyệt trong cuộc trò chuyện và lệnh `/approve`.

Sử dụng yêu cầu quyền của Plugin cho các quyền của Plugin/ứng dụng. Chúng không thay thế
phê duyệt thực thi trên máy chủ, danh sách cho phép công cụ tùy chọn hoặc quy trình
xem xét quyền gốc của Codex.

## Chọn cổng kiểm soát phù hợp

Chọn cổng kiểm soát khớp với điểm ra quyết định bạn cần:

| Cổng kiểm soát                    | Sử dụng khi                                                               | Nội dung kiểm soát                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Công cụ tùy chọn                 | Công cụ không nên hiển thị với mô hình cho đến khi người dùng chọn tham gia. | Việc cung cấp công cụ thông qua `tools.allow`.                                                                              |
| Yêu cầu quyền của Plugin         | Hook Plugin hoặc thao tác do Plugin sở hữu phải xin phép trước khi chạy một hành động. | Phê duyệt lúc chạy thông qua `plugin.approval.*`.                                                                     |
| Phê duyệt thực thi               | Lệnh trên máy chủ hoặc công cụ dạng shell cần người vận hành phê duyệt.               | Chính sách thực thi trên máy chủ và danh sách cho phép thực thi lâu dài.                                                                     |
| Yêu cầu quyền gốc của Codex      | Codex xin phép trước các hành động shell, tệp, MCP hoặc máy chủ ứng dụng gốc.        | Xử lý phê duyệt của máy chủ ứng dụng Codex hoặc hook gốc, được định tuyến qua phê duyệt Plugin khi OpenClaw sở hữu lời nhắc. |
| Yêu cầu phê duyệt MCP            | Máy chủ MCP của Codex yêu cầu phê duyệt cho một lệnh gọi công cụ.                    | Phản hồi phê duyệt MCP được bắc cầu thông qua phê duyệt Plugin của OpenClaw.                                                 |

Công cụ tùy chọn là cổng kiểm soát tại thời điểm khám phá. Yêu cầu quyền của Plugin là
cổng kiểm soát cho từng lệnh gọi. Sử dụng cả hai khi một công cụ nhạy cảm phải yêu cầu người dùng
chọn tham gia rõ ràng trước khi mô hình có thể nhìn thấy công cụ đó và phải được phê duyệt
trước khi hành động chạy.

## Yêu cầu phê duyệt trước một lệnh gọi công cụ

Hầu hết lời nhắc do Plugin tạo nên bắt đầu trong hook `before_tool_call`. Hook này
chạy sau khi mô hình chọn công cụ và trước khi OpenClaw thực thi công cụ đó:

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
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Viết nội dung lời nhắc dành cho người sẽ phê duyệt hành động:

- Giữ `title` ngắn gọn và tập trung vào hành động; Gateway giới hạn nội dung này ở 80 ký tự.
- Giữ `description` cụ thể và có phạm vi rõ ràng; Gateway giới hạn nội dung này ở 512
  ký tự.
- Bao gồm hành động, mục tiêu và rủi ro. Không bao gồm thông tin bí mật, token hoặc
  tải trọng riêng tư không nên xuất hiện trên các bề mặt phê duyệt trong cuộc trò chuyện.
- `severity` mặc định là `"warning"` khi bị bỏ qua. Chỉ sử dụng `"critical"` cho
  các hành động mà quyết định sai có thể gây thiệt hại cho hệ thống sản xuất hoặc mất dữ liệu.
- `allowedDecisions` mặc định là `["allow-once", "allow-always", "deny"]` khi
  bị bỏ qua. Truyền `["allow-once", "deny"]` khi việc tin cậy lâu dài không an toàn đối với
  hành động đó.
- `timeoutMs` mặc định là 120000 (2 phút) và bị giới hạn ở 600000 (10
  phút) bất kể giá trị được yêu cầu.

## Hành vi quyết định

OpenClaw tạo một phê duyệt đang chờ với ID `plugin:`, phân phối phê duyệt đó đến
các bề mặt phê duyệt hiện có và chờ quyết định.

| Quyết định         | Kết quả                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | Lệnh gọi hiện tại tiếp tục.                                               |
| `allow-always`    | Lệnh gọi hiện tại tiếp tục và quyết định được chuyển đến Plugin.      |
| `deny`            | Lệnh gọi bị chặn với kết quả công cụ bị từ chối.                            |
| Hết thời gian chờ  | Lệnh gọi bị chặn.                                                      |
| Hủy bỏ             | Lệnh gọi bị chặn khi lượt chạy bị hủy.                              |
| Không có tuyến phê duyệt | Lệnh gọi bị chặn vì không có bề mặt phê duyệt nào đang kết nối có thể xử lý yêu cầu. |

Chỉ các quyết định `allow-once` và `allow-always` chính xác được yêu cầu cho phép
mới cho phép thực thi. Các quyết định không xác định, không đúng định dạng, không khớp, bị thiếu
và hết thời gian chờ đều bị từ chối theo mặc định. Trường cũ `timeoutBehavior` vẫn được chấp nhận để
tương thích với Plugin nhưng đã ngừng khuyến nghị và bị bỏ qua; không đặt trường này trong hook mới.

`allow-always` chỉ có hiệu lực lâu dài khi Plugin hoặc runtime đưa ra yêu cầu triển khai
cơ chế lưu trạng thái đó. Đối với các hook `before_tool_call.requireApproval` thông thường,
OpenClaw coi `allow-once` và `allow-always` là các quyết định phê duyệt cho
lệnh gọi hiện tại và chuyển giá trị đã xử lý đến `onResolution`. Nếu Plugin của bạn
cung cấp `allow-always`, hãy ghi tài liệu và triển khai chính xác những lệnh gọi trong tương lai
mà cơ chế đó tin cậy.

Nếu hook cũng trả về `params`, OpenClaw chỉ áp dụng các thay đổi tham số đó
sau khi phê duyệt thành công. Hook có mức ưu tiên thấp hơn vẫn có thể chặn sau khi
hook có mức ưu tiên cao hơn yêu cầu phê duyệt.

`allowedDecisions` giới hạn các nút và lệnh được hiển thị cho người dùng.
Gateway từ chối mọi lần thử xử lý bằng quyết định mà yêu cầu không cung cấp.

## Định tuyến lời nhắc phê duyệt

Lời nhắc phê duyệt có thể được xử lý trên các bề mặt giao diện người dùng cục bộ hoặc trong các kênh trò chuyện
hỗ trợ xử lý phê duyệt. Để chuyển tiếp lời nhắc phê duyệt Plugin đến các mục tiêu trò chuyện
được chỉ định rõ ràng, hãy cấu hình `approvals.plugin`:

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

`approvals.plugin` độc lập với `approvals.exec`. Bật tính năng chuyển tiếp phê duyệt thực thi
không định tuyến lời nhắc phê duyệt Plugin, và bật tính năng chuyển tiếp phê duyệt Plugin
không thay đổi chính sách thực thi trên máy chủ.

Khi lời nhắc có nội dung phê duyệt thủ công, hãy xử lý bằng một trong các
quyết định được cung cấp:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Xem [Phê duyệt thực thi nâng cao](/vi/tools/exec-approvals-advanced#plugin-approval-forwarding)
để biết đầy đủ mô hình chuyển tiếp, hành vi phê duyệt trong cùng cuộc trò chuyện, việc phân phối
gốc của kênh và các quy tắc người phê duyệt dành riêng cho từng kênh.

## Quyền gốc của Codex

Lời nhắc quyền gốc của Codex cũng có thể đi qua phê duyệt Plugin, nhưng
chúng có quyền sở hữu khác với các hook do Plugin tạo.

- Yêu cầu phê duyệt của máy chủ ứng dụng Codex được định tuyến qua OpenClaw sau khi Codex xem xét.
- Bộ chuyển tiếp hook gốc `permission_request` có thể yêu cầu thông qua
  `plugin.approval.request` khi bộ chuyển tiếp đó được bật.
- Yêu cầu phê duyệt công cụ MCP được định tuyến qua phê duyệt Plugin khi Codex đánh dấu
  `_meta.codex_approval_kind` là `"mcp_tool_call"`.

Xem [Runtime bộ khai thác Codex](/vi/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
để biết hành vi và quy tắc dự phòng dành riêng cho Codex.

## Khắc phục sự cố

**Công cụ cho biết phê duyệt Plugin không khả dụng.** Không có giao diện người dùng phê duyệt hoặc tuyến
phê duyệt đã cấu hình nào chấp nhận yêu cầu. Hãy kết nối một máy khách có khả năng phê duyệt, sử dụng
kênh hỗ trợ `/approve` trong cùng cuộc trò chuyện hoặc cấu hình `approvals.plugin`.

**`allow-always` xuất hiện nhưng lệnh gọi tiếp theo lại nhắc.** Luồng phê duyệt Plugin
chung không tự động lưu trạng thái tin cậy cho các hook tùy ý. Hãy lưu
trạng thái tin cậy do Plugin sở hữu trong Plugin của bạn sau `onResolution("allow-always")`, hoặc
chỉ cung cấp `allow-once` và `deny`.

**`/approve` từ chối quyết định.** Yêu cầu đã giới hạn
`allowedDecisions`. Hãy sử dụng một trong các quyết định được in trong lời nhắc.

**Lời nhắc Discord, Matrix, Slack hoặc Telegram được định tuyến khác với phê duyệt
thực thi.** Phê duyệt Plugin và phê duyệt thực thi sử dụng cấu hình riêng biệt và có thể sử dụng
các bước kiểm tra ủy quyền khác nhau. Hãy xác minh `approvals.plugin` và khả năng hỗ trợ
phê duyệt Plugin của kênh thay vì chỉ kiểm tra `approvals.exec`.

## Liên quan

- [Hook Plugin](/vi/plugins/hooks#tool-call-policy)
- [Xây dựng Plugin](/vi/plugins/building-plugins#registering-tools)
- [Phê duyệt thực thi nâng cao](/vi/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Giao thức Gateway](/vi/gateway/protocol)
- [Runtime bộ khai thác Codex](/vi/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
