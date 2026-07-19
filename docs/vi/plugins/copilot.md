---
read_when:
    - Bạn muốn sử dụng bộ khung GitHub Copilot SDK cho một agent
    - Bạn cần các ví dụ cấu hình cho runtime `copilot`
    - Bạn đang kết nối một agent với gói đăng ký Copilot (github / openclaw / copilot) và muốn agent đó chạy thông qua Copilot CLI
summary: Chạy các lượt tác tử nhúng của OpenClaw thông qua bộ khung SDK GitHub Copilot bên ngoài
title: Bộ khung Copilot SDK
x-i18n:
    generated_at: "2026-07-19T05:52:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8644ef9037e05e88a10b059d1a13386a93128c70ac47b834b93099e0368fb1ed
    source_path: plugins/copilot.md
    workflow: 16
---

Plugin `@openclaw/copilot` bên ngoài chạy các lượt agent Copilot theo gói đăng ký được nhúng thông qua GitHub Copilot CLI (`@github/copilot-sdk`) thay vì harness tích hợp sẵn của OpenClaw. Phiên Copilot CLI sở hữu vòng lặp agent cấp thấp: thực thi công cụ gốc, compaction gốc (`infiniteSessions`) và trạng thái luồng do CLI quản lý trong `copilotHome`. OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn mô hình, công cụ động (được bắc cầu), phê duyệt, phân phối phương tiện, bản sao transcript hiển thị, câu hỏi phụ `/btw` (xem
[Câu hỏi phụ (`/btw`)](#side-questions-btw)) và `openclaw doctor`.

Để tìm hiểu cách phân chia rộng hơn giữa mô hình/nhà cung cấp/runtime, hãy bắt đầu với
[Runtime của agent](/vi/concepts/agent-runtimes).

## Yêu cầu

- OpenClaw đã cài đặt Plugin `@openclaw/copilot`.
- Nếu cấu hình của bạn sử dụng `plugins.allow`, hãy bao gồm `copilot` (id manifest mà
  Plugin khai báo). Mục danh sách cho phép dùng tên gói npm
  `@openclaw/copilot` sẽ không khớp và khiến Plugin tiếp tục bị chặn, ngay cả khi
  đã đặt `agentRuntime.id: "copilot"`.
- Gói đăng ký GitHub Copilot có thể vận hành Copilot CLI, hoặc
  biến môi trường `gitHubToken` / mục hồ sơ xác thực dành cho các lần chạy headless hoặc cron.
- Thư mục `copilotHome` có thể ghi. Mặc định là `<agentDir>/copilot` khi
  OpenClaw cung cấp thư mục agent, nếu không thì là
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` chạy [hợp đồng doctor](#doctor) của Plugin để quản lý quyền sở hữu trạng thái phiên và các lần di chuyển cấu hình trong tương lai. Lệnh này không thăm dò môi trường Copilot CLI.

## Cài đặt

Runtime Copilot được phân phối dưới dạng Plugin bên ngoài để gói `openclaw` cốt lõi không phải chứa `@github/copilot-sdk` hoặc tệp nhị phân CLI `@github/copilot-<platform>-<arch>` dành riêng cho từng nền tảng (tổng cộng khoảng 260 MB).
Chỉ cài đặt Plugin này cho các agent chọn sử dụng runtime này:

```bash
openclaw plugins install @openclaw/copilot
```

Trình hướng dẫn thiết lập tự động cài đặt Plugin vào lần đầu bạn chọn
mô hình `github-copilot/*` **và** cấu hình của bạn định tuyến mô hình đó (hoặc
nhà cung cấp của mô hình) đến runtime Copilot thông qua `agentRuntime: { id: "copilot" }`; xem
[Bắt đầu nhanh](#quickstart). Nếu không có lựa chọn tham gia đó, OpenClaw sử dụng
nhà cung cấp GitHub Copilot tích hợp sẵn và không bao giờ cài đặt Plugin này.

Runtime phân giải SDK theo thứ tự sau:

1. `import("@github/copilot-sdk")` từ gói `@openclaw/copilot`
   đã cài đặt.
2. Thư mục dự phòng `~/.openclaw/npm-runtime/copilot/` (đích cài đặt theo yêu cầu
   cũ).

SDK bị thiếu sẽ tạo ra một lỗi duy nhất có mã `COPILOT_SDK_MISSING` và lệnh
cài đặt lại ở trên.

## Bắt đầu nhanh

Ghim một mô hình (hoặc một nhà cung cấp) vào harness:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Đặt `agentRuntime.id` trên một mục mô hình riêng lẻ để chỉ định tuyến mô hình đó qua
harness, hoặc đặt trên một nhà cung cấp để định tuyến mọi mô hình thuộc nhà cung cấp đó.

`github-copilot/auto` là điểm khởi đầu có tính di động. Các mô hình Copilot có tên
phụ thuộc vào chính sách tài khoản và tổ chức; hãy xác nhận Copilot CLI đã xác thực của bạn thực sự cung cấp một mô hình trước khi ghim mô hình đó.

## Nhà cung cấp được hỗ trợ

Harness hỗ trợ nhà cung cấp `github-copilot` chính tắc (thuộc sở hữu của
`extensions/github-copilot`), cùng với các mục `models.providers` tùy chỉnh khi
mô hình có `baseUrl` không rỗng và một trong các dạng `api` sau:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (completions tương thích với OpenAI)
- `openai-completions`
- `openai-responses`

Các id nhà cung cấp gốc (`openai`, `anthropic`, `google`, `ollama`) vẫn thuộc quyền sở hữu của
runtime gốc tương ứng. Thay vào đó, hãy dùng một id nhà cung cấp tùy chỉnh riêng biệt để định tuyến endpoint
qua Copilot BYOK.

Các endpoint Copilot BYOK phải là URL HTTPS công khai. Harness cung cấp cho
Copilot SDK một proxy loopback cho mỗi lần thử, sau đó chuyển tiếp lưu lượng của nhà cung cấp
qua đường dẫn fetch được bảo vệ của OpenClaw để việc ghim DNS và chính sách SSRF vẫn
thuộc quyền sở hữu của OpenClaw. Hãy dùng runtime OpenClaw gốc cho Ollama cục bộ, LM
Studio hoặc các máy chủ mô hình trong LAN.

## BYOK

Copilot BYOK sử dụng hợp đồng nhà cung cấp tùy chỉnh cấp phiên của SDK. OpenClaw
truyền endpoint mô hình đã phân giải, khóa API, chế độ bearer token, header, id mô hình
và giới hạn ngữ cảnh/đầu ra; logic truyền tải của nhà cung cấp vẫn nằm trong SDK, không nằm trong
phần cốt lõi.

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

Các phiên BYOK được định danh riêng với phiên đăng ký và với các
endpoint hoặc thông tin xác thực BYOK khác. Việc luân chuyển khóa, header, mô hình hoặc endpoint
sẽ bắt đầu một phiên Copilot SDK mới thay vì tiếp tục trạng thái không tương thích.

## Xác thực

Thứ tự ưu tiên, được áp dụng cho từng agent trong `runCopilotAttempt`:

1. **`useLoggedInUser: true` rõ ràng** trên đầu vào lần thử — sử dụng
   người dùng đã đăng nhập của Copilot CLI trong `copilotHome` của agent.
2. **`gitHubToken` rõ ràng** trên đầu vào lần thử (yêu cầu `profileId` +
   `profileVersion`). Dành cho các lần gọi CLI trực tiếp và các bài kiểm thử cần
   bỏ qua quá trình phân giải hồ sơ xác thực.
3. **`resolvedApiKey` + `authProfileId` được phân giải theo hợp đồng** — đường dẫn chính
   trong môi trường sản xuất. Phần cốt lõi phân giải hồ sơ xác thực `github-copilot` đã cấu hình
   (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) của agent trước khi
   gọi harness, nhờ đó hồ sơ xác thực `github-copilot:<profile>` hoạt động
   xuyên suốt cho các thiết lập headless, cron hoặc nhiều hồ sơ mà không cần biến môi trường.
4. **Phương án dự phòng bằng biến môi trường**, được kiểm tra theo thứ tự này (giá trị không rỗng đầu tiên sẽ được dùng,
   chuỗi rỗng được coi là không có; phản ánh thứ tự ưu tiên của nhà cung cấp `github-copilot`
   đã phát hành trong `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — giá trị ghi đè dành riêng cho harness; cho phép bạn ghim một
      token cho harness OpenClaw mà không ảnh hưởng đến `gh` toàn hệ thống /
      cấu hình Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` — biến môi trường tiêu chuẩn của Copilot SDK / CLI.
   3. `GH_TOKEN` — biến môi trường tiêu chuẩn của CLI `gh`.
   4. `GITHUB_TOKEN` — phương án dự phòng dùng token GitHub chung.

   Id hồ sơ pool được tổng hợp là `env:<NAME>`; phiên bản hồ sơ là một
   dấu vân tay sha256 không thể đảo ngược của token, vì vậy việc luân chuyển giá trị môi trường
   sẽ làm mới hoàn toàn pool máy khách.

5. **`useLoggedInUser` mặc định** khi không có tín hiệu token nào.

Mỗi agent có `copilotHome` riêng để token, phiên và
cấu hình Copilot CLI không bao giờ rò rỉ giữa các agent trên cùng một máy. Mặc định:
`<agentDir>/copilot` (giữ trạng thái SDK bên ngoài cùng thư mục với
`models.json` / `auth-profiles.json` của OpenClaw), hoặc
`~/.openclaw/agents/<agentId>/copilot` khi không cung cấp thư mục agent.
Ghi đè bằng `copilotHome: <path>` trên đầu vào lần thử để dùng một
vị trí tùy chỉnh (ví dụ: một mount dùng chung để di chuyển).

Các bài kiểm thử harness trực tiếp sử dụng `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` cho token
trực tiếp. Thiết lập kiểm thử trực tiếp dùng chung sẽ xóa `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
và `GITHUB_TOKEN` sau khi đưa các hồ sơ xác thực thật vào thư mục home kiểm thử biệt lập,
vì vậy giá trị `gh auth token` được truyền qua biến chuyên dụng sẽ tránh
việc bỏ qua sai mà không rò rỉ sang các bộ kiểm thử không liên quan.

## Bề mặt cấu hình

Harness đọc cấu hình từ đầu vào của từng lần thử (`runCopilotAttempt({...})`)
cùng với một tập nhỏ các giá trị mặc định từ biến môi trường bên trong `extensions/copilot/src/`:

| Trường                   | Mục đích                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Thư mục trạng thái CLI cho từng agent (mặc định như trên).                                                                                                                                                                                                                                                 |
| `model`                  | Chuỗi hoặc `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Bỏ qua để dùng lựa chọn mô hình thông thường của agent; harness xác minh nhà cung cấp đã phân giải được hỗ trợ.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Ánh xạ từ quá trình phân giải `ThinkLevel` / `ReasoningLevel` của OpenClaw trong `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | Giá trị ghi đè tùy chọn cho khối `infiniteSessions` của SDK do `harness.compact` điều khiển. Có thể giữ nguyên một cách an toàn.                                                                                                                                                                                        |
| `hooksConfig`            | Cấu hình `SessionHooks` gốc tùy chọn của Copilot SDK cho các callback công cụ/MCP, lời nhắc người dùng, phiên và lỗi. Tách biệt với các hook vòng đời có tính di động của OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | Giá trị ghi đè tùy chọn cho trình xử lý `onPermissionRequest` của SDK dành cho các loại công cụ SDK tích hợp (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Mặc định là `rejectAllPolicy` như một lớp bảo vệ an toàn; xem [Quyền và ask_user](#permissions-and-ask_user) để biết vì sao nó thực tế không bao giờ được kích hoạt. |
| `enableSessionTelemetry` | Cờ đo từ xa phiên SDK tùy chọn.                                                                                                                                                                                                                                                            |

Các hook Plugin OpenClaw không cần cấu hình lần thử dành riêng cho Copilot.
Harness chạy `before_prompt_build` (và hook tương thích cũ `before_agent_start`),
`llm_input`, `llm_output` và `agent_end` thông qua các
trình trợ giúp harness tiêu chuẩn. Các lần compaction SDK thành công cũng chạy
`before_compaction` và `after_compaction`. Các công cụ OpenClaw được bắc cầu chạy
`before_tool_call` và báo cáo `after_tool_call`; `hooksConfig` vẫn dành cho
các callback chỉ có trong SDK gốc mà không có tương đương có tính di động.

Không có thành phần nào khác trong OpenClaw cần biết về các trường này. Các Plugin,
kênh và mã cốt lõi khác chỉ thấy dạng `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult` tiêu chuẩn.

## Compaction

Khi `harness.compact` chạy, harness Copilot SDK:

1. Tiếp tục phiên SDK được theo dõi mà không tiếp tục công việc đang chờ xử lý.
2. Gọi RPC compaction lịch sử trong phạm vi phiên của SDK.
3. Trả về kết quả compaction của SDK mà không ghi các tệp đánh dấu tương thích
   trong không gian làm việc.

Bản sao transcript phía OpenClaw (bên dưới) tiếp tục nhận các thông báo sau compaction,
nên lịch sử trò chuyện hiển thị cho người dùng vẫn nhất quán.

## Sao chép transcript

`runCopilotAttempt` ghi kép các thông điệp có thể phản chiếu của mỗi lượt vào
bản ghi kiểm tra OpenClaw thông qua
`extensions/copilot/src/dual-write-transcripts.ts`. Bản phản chiếu được giới hạn theo từng
phiên (`copilot:${sessionId}`) và định khóa theo từng thông điệp
(`${role}:${sha256_16(role,content)}`), vì vậy các mục của lượt trước được phát lại
sẽ trùng với các khóa hiện có trên đĩa thay vì bị nhân bản.

Hai lớp ngăn chặn lỗi bao bọc bản phản chiếu để lỗi ghi bản ghi
không bao giờ làm lần thử thất bại: một trình bao nội bộ theo nguyên tắc nỗ lực tối đa, cùng với một
`.catch(...)` phòng thủ nhiều lớp ở cấp lần thử. Lỗi được ghi nhật ký, không
được hiển thị.

## Câu hỏi phụ (`/btw`)

`/btw` **không** có sẵn nguyên bản trên harness này. `createCopilotAgentHarness()`
cố ý để `harness.runSideQuestion` không được xác định
(được xác nhận trong `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
vì vậy bộ điều phối `/btw` của OpenClaw (`src/agents/btw.ts`) chuyển sang
cùng đường dẫn được dùng cho mọi runtime không phải Codex: nhà cung cấp mô hình
đã cấu hình được gọi trực tiếp bằng một prompt câu hỏi phụ ngắn và phản hồi được truyền phát lại qua
`streamSimple` (không có phiên CLI, không chiếm thêm vị trí trong pool).

Điều này dành riêng các phiên Copilot CLI cho vòng lặp lượt chính của agent và
giữ hành vi `/btw` giống hệt các runtime không phải Codex khác.

## Doctor

`extensions/copilot/doctor-contract-api.ts` được
`src/plugins/doctor-contract-registry.ts` tự động tải. Thành phần này cung cấp:

- Một `legacyConfigRules` trống (chưa có trường nào bị ngừng sử dụng).
- Một `normalizeCompatibilityConfig` không thực hiện thao tác nào (được giữ lại để các trường bị ngừng sử dụng trong tương lai
  có một vị trí ổn định trong cây nguồn).
- Một mục `sessionRouteStateOwners`: nhà cung cấp `github-copilot`, runtime
  `copilot`, khóa phiên CLI `copilot`, tiền tố hồ sơ xác thực `github-copilot:`.

## Hạn chế

- Harness nhận quản lý `github-copilot` cùng các ID nhà cung cấp BYOK tùy chỉnh không có chủ sở hữu.
  Các ID nhà cung cấp nguyên bản thuộc sở hữu manifest vẫn ở runtime sở hữu chúng ngay cả khi
  `agentRuntime.id` bị buộc thành `copilot`.
- Không có giao diện TUI; TUI của PI vẫn là phương án dự phòng cho các runtime không có
  giao diện tương ứng.
- Trạng thái phiên PI không được di chuyển khi agent chuyển sang `copilot`.
  Việc lựa chọn được thực hiện theo từng lần thử; các phiên PI hiện có vẫn hợp lệ.
- `ask_user` sử dụng runtime câu hỏi Gateway trung lập với nhà cung cấp. Control
  UI hiển thị cùng thẻ câu hỏi như các câu hỏi OpenClaw khác, các
  kênh được hỗ trợ hiển thị nút lựa chọn, và thông điệp văn bản thuần tiếp theo trong hàng đợi
  giải quyết bản ghi Gateway đó trước khi yêu cầu SDK trả về.

## Quyền và ask_user

Việc thực thi quyền đối với các công cụ OpenClaw được bắc cầu diễn ra **bên trong trình bao công cụ**,
không thông qua callback `onPermissionRequest` của SDK. Cùng một
`wrapToolWithBeforeToolCallHook` mà PI sử dụng
(`src/agents/agent-tools.before-tool-call.ts`) được
`createOpenClawCodingTools` áp dụng cho mọi công cụ lập trình: phát hiện vòng lặp, chính sách
Plugin đáng tin cậy, hook trước khi gọi công cụ và phê duyệt Plugin hai giai đoạn qua
Gateway (`plugin.approval.request`) đều chạy qua chính xác cùng đường dẫn mã
như các lần thử PI nguyên bản.

Mỗi công cụ SDK do cầu nối công cụ Copilot trả về được đánh dấu bằng:

- `overridesBuiltInTool: true` — thay thế công cụ tích hợp sẵn cùng tên của Copilot CLI
  (edit, read, write, bash, ...) để mọi lệnh gọi công cụ đều định tuyến trở lại
  OpenClaw.
- `skipPermission: true` — yêu cầu SDK không kích hoạt
  `onPermissionRequest({kind: "custom-tool"})` trước khi gọi công cụ.
  `execute()` đã được bao bọc vốn đã thực hiện bước kiểm tra chính sách OpenClaw đầy đủ hơn; một
  prompt ở cấp SDK sẽ либо bỏ qua bước thực thi của OpenClaw
  (cho phép tất cả) hoặc chặn mọi lệnh gọi công cụ (từ chối tất cả) — cả hai đều không tương đương
  với PI.

Harness Codex trong cây nguồn sử dụng cùng cách phân tách: các công cụ OpenClaw được bắc cầu
được bao bọc (`extensions/codex/src/app-server/dynamic-tools.ts`) và các loại phê duyệt nguyên bản của
codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) định tuyến qua `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Thành phần tương đương trong Copilot SDK
— `rejectAllPolicy` đóng khi lỗi đối với bất kỳ loại nào không phải `custom-tool`
mà có thể đến `onPermissionRequest` — là cùng một mạng lưới an toàn, và trên
thực tế không bao giờ được kích hoạt vì `overridesBuiltInTool: true` thay thế mọi
công cụ tích hợp sẵn.

Để lớp công cụ được bao bọc đưa ra các quyết định chính sách tương đương với PI,
harness chuyển tiếp đầy đủ ngữ cảnh công cụ của lần thử PI tới
`createOpenClawCodingTools`: danh tính (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), kênh/định tuyến (`groupId`,
`currentChannelId`, `replyToMode`, các nút bật/tắt công cụ thông điệp), xác thực
(`authProfileStore`), danh tính lượt chạy (`sessionKey` / `runSessionKey` được suy ra
từ `sandboxSessionKey`, `runId`), ngữ cảnh mô hình (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) và các hook lượt chạy
(`onToolOutcome`, `onYield`). Nếu thiếu các trường này, danh sách cho phép chỉ dành cho chủ sở hữu
sẽ âm thầm từ chối theo mặc định, chính sách tin cậy Plugin không thể phân giải đúng
phạm vi và `session_status: "current"` phân giải thành một khóa sandbox lỗi thời. Trình
tạo cầu nối là `extensions/copilot/src/tool-bridge.ts`, phản chiếu lệnh gọi có thẩm quyền của PI
tại `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` phân giải ngữ cảnh sandbox thông qua seam dùng chung
`resolveSandboxContext`, truyền cho SDK một thư mục làm việc có hiệu lực
và chuyển tiếp `sandbox` cùng không gian làm việc tạo subagent vào cầu nối
công cụ. Cầu nối cũng chuyển tiếp các cơ chế kiểm soát xây dựng công cụ có giới hạn mà nó
có thể thực thi tại ranh giới SDK: `includeCoreTools`, danh sách cho phép công cụ của
runtime và `toolConstructionPlan`.

Cầu nối cũng sử dụng trình trợ giúp bề mặt công cụ harness dùng chung từ
`openclaw/plugin-sdk/agent-harness-tool-runtime` để tương đương với PI. Khi
tìm kiếm công cụ được bật, SDK nhìn thấy các công cụ điều khiển nhỏ gọn cùng một
trình thực thi danh mục ẩn thay vì mọi schema công cụ OpenClaw. Khi chế độ mã được
bật, trình trợ giúp xây dựng cùng bề mặt điều khiển chế độ mã và vòng đời
danh mục mà các harness agent khác sử dụng. Các giá trị mặc định tinh gọn cho mô hình cục bộ,
việc lọc schema tương thích với runtime, nạp dữ liệu thư mục và dọn dẹp danh mục
đều nằm trong trình trợ giúp dùng chung để các harness Copilot và lân cận Codex
không bị sai lệch.

### Token GitHub cấp phiên

Hợp đồng Copilot SDK phân biệt token GitHub **cấp máy khách**
(`CopilotClientOptions.gitHubToken`, xác thực chính tiến trình CLI)
với token **cấp phiên** (`SessionConfig.gitHubToken`, xác định
việc loại trừ nội dung, định tuyến mô hình và hạn mức cho phiên đó; được tuân thủ trên
cả `createSession` và `resumeSession`). Harness phân giải xác thực một lần qua
`resolveCopilotAuth` và đặt cả hai trường khi chế độ xác thực là `gitHubToken`
(một `auth.gitHubToken` tường minh hoặc một `resolvedApiKey` được phân giải theo hợp đồng từ
hồ sơ xác thực `github-copilot` đã cấu hình). Khi chế độ đã phân giải là
`useLoggedInUser`, trường cấp phiên bị bỏ qua để SDK tiếp tục
suy ra danh tính từ danh tính đã đăng nhập.

`ask_user` sử dụng `SessionConfig.onUserInputRequest`. Cầu nối đăng ký các
lựa chọn SDK hoặc prompt văn bản tự do không có tùy chọn làm câu hỏi Gateway, chấp nhận chỉ mục
hoặc nhãn lựa chọn đối với yêu cầu có lựa chọn cố định và chấp nhận câu trả lời tự do
khi yêu cầu SDK cho phép. Việc hủy lần thử OpenClaw sẽ hủy bản ghi
Gateway và trả về một câu trả lời SDK trống.

## Liên quan

- [Runtime agent](/vi/concepts/agent-runtimes)
- [Harness Codex](/vi/plugins/codex-harness)
- [Plugin harness agent (tài liệu tham khảo SDK)](/vi/plugins/sdk-agent-harness)
