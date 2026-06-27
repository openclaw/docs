---
read_when:
    - Bạn muốn dùng harness SDK GitHub Copilot cho một agent
    - Bạn cần các ví dụ cấu hình cho thời gian chạy `copilot`
    - Bạn đang kết nối một agent với Copilot thuê bao (github / openclaw / copilot) và muốn nó chạy qua Copilot CLI
summary: Chạy các lượt tác nhân nhúng của OpenClaw thông qua harness SDK GitHub Copilot bên ngoài
title: Bộ khai thác SDK Copilot
x-i18n:
    generated_at: "2026-06-27T17:46:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Plugin `@openclaw/copilot` bên ngoài cho phép OpenClaw chạy các lượt tác nhân Copilot theo gói đăng ký được nhúng thông qua GitHub Copilot CLI (`@github/copilot-sdk`) thay vì harness PI tích hợp sẵn.

Dùng harness Copilot SDK khi bạn muốn phiên Copilot CLI sở hữu vòng lặp tác nhân cấp thấp: thực thi công cụ gốc, Compaction gốc (`infiniteSessions`) và trạng thái luồng do CLI quản lý trong `copilotHome`. OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn mô hình, công cụ động OpenClaw (được bắc cầu), phê duyệt, phân phối media, bản sao bản ghi hiển thị, câu hỏi phụ `/btw` (do fallback PI trong cây xử lý — xem [Câu hỏi phụ (`/btw`)](#side-questions-btw)) và `openclaw doctor`.

Để hiểu phần tách rộng hơn giữa mô hình/nhà cung cấp/runtime, hãy bắt đầu với [Runtime tác nhân](/vi/concepts/agent-runtimes).

## Yêu cầu

- OpenClaw có Plugin `@openclaw/copilot` đã được cài đặt.
- Nếu cấu hình của bạn dùng `plugins.allow`, hãy bao gồm `copilot` (id manifest do Plugin khai báo). Một danh sách cho phép hạn chế dùng tên gói kiểu npm `@openclaw/copilot` sẽ khiến Plugin vẫn bị chặn và runtime sẽ không tải ngay cả với `agentRuntime.id: "copilot"`.
- Gói đăng ký GitHub Copilot có thể điều khiển Copilot CLI (hoặc một mục env / hồ sơ xác thực `gitHubToken` cho các lần chạy headless / cron).
- Một thư mục `copilotHome` có thể ghi. Harness mặc định là `<agentDir>/copilot` khi OpenClaw cung cấp thư mục tác nhân, nếu không là `~/.openclaw/agents/<agentId>/copilot` để cô lập hoàn toàn theo từng tác nhân.

`openclaw doctor` chạy [hợp đồng doctor](#doctor) của Plugin cho quyền sở hữu trạng thái phiên khai báo và các di trú tương thích trong tương lai. Nó không chạy các probe môi trường Copilot CLI.

## Cài đặt Plugin

Runtime Copilot là một Plugin bên ngoài nên gói lõi `openclaw` không mang dependency `@github/copilot-sdk` hoặc binary CLI theo nền tảng `@github/copilot-<platform>-<arch>` của nó. Cùng nhau chúng thêm khoảng 260 MB, vì vậy chỉ cài đặt chúng cho các tác nhân chọn dùng runtime này:

```bash
openclaw plugins install @openclaw/copilot
```

Trình hướng dẫn cài đặt Plugin lần đầu tiên bạn chọn một mô hình `github-copilot/*` **và** cấu hình của bạn chọn mô hình đó (hoặc nhà cung cấp của nó) vào runtime tác nhân Copilot thông qua `agentRuntime: { id: "copilot" }` (xem [Khởi động nhanh](#quickstart) bên dưới). Nếu không chọn vào, openclaw dùng nhà cung cấp GitHub Copilot tích hợp sẵn và không bao giờ cài đặt Plugin runtime.

Runtime phân giải SDK theo thứ tự này:

1. `import("@github/copilot-sdk")` từ gói `@openclaw/copilot` đã cài đặt.
2. Thư mục fallback nổi tiếng `~/.openclaw/npm-runtime/copilot/` (đích cài đặt theo yêu cầu legacy).

SDK bị thiếu sẽ hiển thị một lỗi duy nhất với mã `COPILOT_SDK_MISSING` và lệnh cài đặt lại Plugin ở trên.

## Khởi động nhanh

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

Hai cách này tương đương. Dùng `agentRuntime.id` trên một mục mô hình duy nhất khi chỉ mô hình đó nên được định tuyến qua harness; đặt `agentRuntime.id` trên một nhà cung cấp khi mọi mô hình thuộc nhà cung cấp đó nên dùng nó.

`github-copilot/auto` là điểm bắt đầu di động. Các mô hình Copilot có tên phụ thuộc vào chính sách tài khoản và tổ chức, vì vậy chỉ ghim một mô hình sau khi xác nhận rằng Copilot CLI đã xác thực có hiển thị nó.

## Nhà cung cấp được hỗ trợ

Harness công bố hỗ trợ nhà cung cấp chuẩn `github-copilot` (cùng id do `extensions/github-copilot` sở hữu):

- `github-copilot`

Nó cũng hỗ trợ các mục `models.providers` tùy chỉnh khi mô hình được chọn có `baseUrl` không rỗng và một trong các dạng API sau:

- `openai-responses`
- `openai-completions`
- `ollama` (completions tương thích OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

Các id nhà cung cấp gốc như `openai`, `anthropic`, `google` và `ollama` vẫn thuộc sở hữu của runtime gốc tương ứng. Dùng một id nhà cung cấp tùy chỉnh riêng biệt khi định tuyến một endpoint qua Copilot BYOK.

Endpoint Copilot BYOK phải là URL HTTPS mạng công khai. Harness cung cấp cho Copilot SDK một URL proxy loopback theo từng lần thử, sau đó chuyển tiếp lưu lượng nhà cung cấp qua đường dẫn fetch được bảo vệ của OpenClaw để chính sách ghim DNS và SSRF vẫn thuộc sở hữu của OpenClaw. Dùng runtime OpenClaw gốc cho Ollama cục bộ, LM Studio hoặc máy chủ mô hình LAN.

## BYOK

Copilot BYOK dùng hợp đồng nhà cung cấp tùy chỉnh cấp phiên của SDK. OpenClaw truyền endpoint mô hình đã phân giải, khóa API, chế độ bearer-token, header, id mô hình và giới hạn ngữ cảnh/đầu ra mà không chuyển logic vận chuyển nhà cung cấp vào lõi.

Ví dụ:

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

Các phiên BYOK được định khóa riêng với phiên đăng ký và với các endpoint hoặc dấu vân tay thông tin xác thực khác. Xoay vòng khóa, header, mô hình hoặc endpoint sẽ tạo một phiên Copilot SDK mới thay vì tiếp tục trạng thái không tương thích.

## Xác thực

Thứ tự ưu tiên theo từng tác nhân, được áp dụng trong `runCopilotAttempt`:

1. **`useLoggedInUser: true` tường minh** trên input lần thử. Dùng người dùng đã đăng nhập của Copilot CLI được phân giải trong `copilotHome` của tác nhân.
2. **`gitHubToken` tường minh** trên input lần thử (với `profileId` + `profileVersion`). Hữu ích cho các lệnh gọi CLI trực tiếp và kiểm thử khi caller muốn bỏ qua phân giải hồ sơ xác thực.
3. **`resolvedApiKey` + `authProfileId` được phân giải theo hợp đồng** từ shape `EmbeddedRunAttemptParams`. Đây là **đường dẫn chính production**: lõi phân giải hồ sơ xác thực `github-copilot` đã cấu hình của tác nhân (qua `src/infra/provider-usage.auth.ts:resolveProviderAuths`) trước khi gọi harness, và harness tiêu thụ trực tiếp cả hai trường. Điều này giúp hồ sơ xác thực `github-copilot:<profile>` hoạt động end-to-end cho các thiết lập headless / cron / nhiều hồ sơ mà không cần biến env.
4. **Fallback biến env** cho các lần chạy CLI trực tiếp / dogfood khi không có hồ sơ xác thực nào được cấu hình. Runtime kiểm tra các biến sau theo thứ tự ưu tiên, phản ánh nhà cung cấp `github-copilot` đã phát hành (`extensions/github-copilot/auth.ts`) và thiết lập Copilot SDK đã được tài liệu hóa:
   1. `OPENCLAW_GITHUB_TOKEN` -- ghi đè riêng cho harness; đặt giá trị này để ghim token cho harness OpenClaw mà không ảnh hưởng cấu hình `gh` / Copilot CLI toàn hệ thống.
   2. `COPILOT_GITHUB_TOKEN` -- biến env chuẩn của Copilot SDK / CLI.
   3. `GH_TOKEN` -- biến env chuẩn của CLI `gh` (khớp với thứ tự ưu tiên của nhà cung cấp `github-copilot` hiện có).
   4. `GITHUB_TOKEN` -- fallback token GitHub chung.

   Giá trị không rỗng đầu tiên thắng; chuỗi rỗng được coi là vắng mặt. Id hồ sơ pool được tổng hợp là `env:<NAME>` và profileVersion là dấu vân tay sha256 không thể đảo ngược của token, vì vậy việc xoay vòng giá trị env sẽ phá cache pool client một cách sạch sẽ.

5. **`useLoggedInUser` mặc định** khi không có tín hiệu token nào khả dụng.

Mỗi tác nhân nhận một `copilotHome` chuyên dụng để token, phiên và cấu hình Copilot CLI không rò rỉ giữa các tác nhân trên cùng máy. Mặc định là `<agentDir>/copilot` khi host giao cho harness một thư mục tác nhân (cô lập trạng thái SDK khỏi `models.json` / `auth-profiles.json` của OpenClaw trong cùng thư mục), hoặc `~/.openclaw/agents/<agentId>/copilot` trong trường hợp khác. Ghi đè bằng `copilotHome: <path>` trên input lần thử khi bạn cần vị trí tùy chỉnh (ví dụ, một mount dùng chung để di trú).

Kiểm thử harness live dùng `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` khi cần token trực tiếp. Thiết lập live-test dùng chung cố ý xóa `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` và `GITHUB_TOKEN` sau khi dàn dựng hồ sơ xác thực thật vào test home cô lập, vì vậy truyền một giá trị `gh auth token` qua biến live-test chuyên dụng sẽ tránh bỏ qua sai mà không để lộ token cho các bộ kiểm thử không liên quan.

## Bề mặt cấu hình

Harness đọc cấu hình của nó từ input theo từng lần thử (`runCopilotAttempt({...})`) cộng với một nhóm nhỏ mặc định env trong `extensions/copilot/src/`:

- `copilotHome` — thư mục trạng thái CLI theo từng tác nhân (mặc định được tài liệu hóa ở trên).
- `model` — chuỗi hoặc `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Khi bỏ qua, OpenClaw dùng lựa chọn mô hình bình thường của tác nhân và harness xác minh nhà cung cấp đã phân giải được hỗ trợ.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Ánh xạ từ phân giải `ThinkLevel` / `ReasoningLevel` của OpenClaw trong `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — ghi đè tùy chọn cho khối SDK `infiniteSessions` do `harness.compact` điều khiển. Các mặc định an toàn để giữ nguyên.
- `hooksConfig` — cấu hình tương thích `SessionHooks` gốc tùy chọn của Copilot SDK cho callback công cụ/MCP, lời nhắc người dùng, phiên và lỗi. Nó tách biệt với hook vòng đời di động của OpenClaw.
- `permissionPolicy` — ghi đè tùy chọn cho handler `onPermissionRequest` của SDK được dùng cho các loại công cụ SDK tích hợp (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Mặc định là `rejectAllPolicy` như một lưới an toàn; trên thực tế SDK không bao giờ gọi bất kỳ loại nào trong số đó vì mọi công cụ OpenClaw được bắc cầu đều được đăng ký với `overridesBuiltInTool: true` và `skipPermission: true`, nên 100% lệnh gọi công cụ đi qua `execute()` được bọc của OpenClaw. Xem [Quyền và ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — cờ telemetry phiên SDK tùy chọn.

Hook Plugin OpenClaw không cần cấu hình lần thử riêng cho Copilot. Harness chạy `before_prompt_build` (và hook tương thích legacy `before_agent_start`), `llm_input`, `llm_output` và `agent_end` qua các helper harness chuẩn. Các lần Compaction SDK thành công cũng chạy `before_compaction` và `after_compaction`. Công cụ OpenClaw được bắc cầu tiếp tục chạy `before_tool_call` và báo cáo `after_tool_call`; `hooksConfig` vẫn dành cho các callback chỉ có trong SDK gốc mà không có tương đương di động.

Không phần nào khác của OpenClaw cần biết về các trường này. Các Plugin, kênh và mã lõi khác chỉ thấy shape chuẩn `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Khi `harness.compact` chạy, harness Copilot SDK:

1. Tiếp tục phiên SDK được theo dõi mà không tiếp tục công việc đang chờ xử lý.
2. Gọi RPC Compaction lịch sử trong phạm vi phiên của SDK.
3. Trả về kết quả Compaction SDK mà không ghi các tệp marker tương thích trong workspace.

Bản sao bản ghi phía OpenClaw (xem bên dưới) tiếp tục nhận các thông điệp sau Compaction, nên lịch sử trò chuyện hướng người dùng vẫn nhất quán.

## Sao chép bản ghi

`runCopilotAttempt` ghi kép các thông điệp có thể sao chép của mỗi lượt vào bản ghi kiểm toán OpenClaw qua `extensions/copilot/src/dual-write-transcripts.ts`. Bản sao được giới hạn theo từng phiên (`copilot:${sessionId}`) và dùng định danh theo từng thông điệp (`${role}:${sha256_16(role,content)}`) để các mục nhập từ lượt trước được phát lại va chạm với khóa hiện có trên đĩa và không bị nhân đôi.

Bản sao được bọc trong hai lớp kiềm chế lỗi để lỗi ghi bản ghi không thể làm hỏng lần thử: một wrapper best-effort nội bộ và một `.catch(...)` phòng thủ chiều sâu ở cấp lần thử. Lỗi được ghi log nhưng không hiển thị.

## Câu hỏi phụ (`/btw`)

`/btw` **không** có sẵn trên harness này. `createCopilotAgentHarness()`
cố ý để `harness.runSideQuestion` là không xác định, nên bộ điều phối `/btw`
của OpenClaw (`src/agents/btw.ts`) rơi về cùng đường dự phòng PI trong cây mã nguồn
mà nó dùng cho mọi runtime không phải Codex: nhà cung cấp mô hình đã cấu hình
được gọi trực tiếp với một prompt câu hỏi phụ ngắn và được truyền phát lại qua
`streamSimple` (không có phiên CLI, không có slot nhóm bổ sung).

Điều này giữ các phiên Copilot CLI dành riêng cho vòng lặp lượt chính của tác nhân, và
giữ hành vi `/btw` giống hệt các runtime dựa trên PI khác. Hợp đồng được
khẳng định trong
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
dưới `describe("runSideQuestion")`.

## Chẩn đoán

`extensions/copilot/doctor-contract-api.ts` được tự động tải bởi
`src/plugins/doctor-contract-registry.ts`. Nó đóng góp:

- Một `legacyConfigRules` trống (không có trường đã ngừng dùng ở MVP).
- Một `normalizeCompatibilityConfig` không làm gì (được giữ lại để các trường ngừng dùng
  trong tương lai có một nơi ổn định trong cây mã nguồn).
- Một mục `sessionRouteStateOwners` nhận quyền sở hữu nhà cung cấp `github-copilot`;
  runtime `copilot`; khóa phiên CLI `copilot`; tiền tố hồ sơ xác thực
  `github-copilot:`.

## Hạn chế

- Harness nhận `github-copilot` cộng với các id nhà cung cấp BYOK tùy chỉnh không có chủ sở hữu.
  Các id nhà cung cấp native thuộc manifest vẫn ở trên runtime sở hữu chúng ngay cả khi
  `agentRuntime.id` bị buộc thành `copilot`.
- Harness không cung cấp TUI; TUI của PI không bị ảnh hưởng và vẫn là
  dự phòng cho bất kỳ runtime nào không có bề mặt ngang hàng.
- Trạng thái phiên PI không được di chuyển khi một tác nhân chuyển sang `copilot`.
  Việc chọn diễn ra theo từng lần thử; các phiên PI hiện có vẫn hợp lệ.
- `ask_user` dùng cùng đường prompt-và-trả-lời của OpenClaw như harness Codex.
  Khi Copilot SDK yêu cầu đầu vào từ người dùng, OpenClaw đăng một
  prompt chặn vào kênh/TUI đang hoạt động và tin nhắn người dùng tiếp theo trong hàng đợi
  sẽ giải quyết yêu cầu SDK.

## Quyền và ask_user

Việc thực thi quyền cho các công cụ OpenClaw được bắc cầu diễn ra **bên trong
trình bọc công cụ**, không thông qua callback `onPermissionRequest` của SDK. Cùng
`wrapToolWithBeforeToolCallHook` mà PI dùng
(`src/agents/pi-tools.before-tool-call.ts`) được
`createOpenClawCodingTools` áp dụng cho mọi công cụ lập trình: phát hiện vòng lặp,
chính sách Plugin tin cậy, hook before-tool-call, và phê duyệt Plugin hai pha
qua Gateway (`plugin.approval.request`) đều chạy với
đúng cùng đường mã như các lần thử PI native.

Để trình bọc đó sở hữu quyết định, SDK Tool do
`convertOpenClawToolToSdkTool` trả về được đánh dấu với:

- `overridesBuiltInTool: true` — thay thế công cụ tích hợp sẵn của Copilot CLI
  có cùng tên (edit, read, write, bash, …) để mọi lời gọi công cụ
  định tuyến trở lại OpenClaw.
- `skipPermission: true` — báo cho SDK không kích hoạt
  `onPermissionRequest({kind: "custom-tool"})` trước khi gọi công cụ.
  `execute()` đã được bọc thực hiện kiểm tra chính sách OpenClaw phong phú hơn
  ở bên trong; một prompt cấp SDK sẽ hoặc đi tắt qua việc thực thi của OpenClaw
  (nếu chúng ta cho phép tất cả) hoặc chặn mọi lần gọi công cụ (nếu chúng ta
  từ chối tất cả) — không trường hợp nào khớp với tính ngang bằng PI.

Harness codex trong cây mã nguồn dùng cùng cách tách này: các công cụ OpenClaw được bắc cầu
được bọc (`extensions/codex/src/app-server/dynamic-tools.ts`) và
các loại phê duyệt native _riêng_ của codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) được định tuyến qua
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Tương đương trong Copilot SDK
— `rejectAllPolicy` fail-closed cho bất kỳ loại không phải `custom-tool`
nào từng tới `onPermissionRequest` — là cùng lớp bảo vệ,
và thực tế nó không kích hoạt vì `overridesBuiltInTool: true`
thay thế mọi công cụ tích hợp sẵn.

Để lớp công cụ được bọc đưa ra quyết định chính sách tương đương PI,
harness chuyển tiếp toàn bộ ngữ cảnh attempt-tool của PI tới
`createOpenClawCodingTools` — danh tính (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), kênh/định tuyến
(`groupId`, `currentChannelId`, `replyToMode`, các bật/tắt message-tool),
xác thực (`authProfileStore`), danh tính lượt chạy
(`sessionKey`/`runSessionKey` dẫn xuất từ `sandboxSessionKey`,
`runId`), ngữ cảnh mô hình (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`), và hook lượt chạy (`onToolOutcome`,
`onYield`). Không có các trường đó, allowlist chỉ dành cho chủ sở hữu âm thầm
hoạt động như từ chối mặc định, chính sách tin cậy Plugin không thể phân giải tới
phạm vi đúng, và `session_status: "current"` phân giải tới một
khóa sandbox cũ. Bộ dựng cầu nối nằm trong
`extensions/copilot/src/tool-bridge.ts` và phản chiếu lời gọi có thẩm quyền của PI tại
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt`
đã phân giải ngữ cảnh sandbox qua seam chung
`resolveSandboxContext`, truyền cho SDK một thư mục làm việc hiệu dụng,
và chuyển tiếp `sandbox` cùng workspace spawn tác nhân con vào
cầu nối công cụ. Cầu nối cũng chuyển tiếp các điều khiển dựng công cụ có giới hạn
mà nó có thể thực thi tại ranh giới SDK: `includeCoreTools`,
allowlist công cụ runtime, và `toolConstructionPlan`.

Cầu nối cũng dùng helper bề mặt công cụ harness dùng chung từ
`openclaw/plugin-sdk/agent-harness-tool-runtime` để ngang bằng với PI. Khi
tool-search được bật, SDK thấy các công cụ điều khiển gọn cùng một trình thực thi catalog ẩn
thay vì mọi schema công cụ OpenClaw. Khi chế độ code được
bật, helper dựng cùng bề mặt điều khiển chế độ code và vòng đời catalog
được các harness tác nhân khác dùng. Mặc định gọn cho mô hình cục bộ,
lọc schema tương thích runtime, hydrate thư mục, và dọn dẹp catalog
đều nằm trong helper dùng chung để các harness Copilot và gần Codex
không lệch nhau.

### Token GitHub cấp phiên

Hợp đồng Copilot SDK phân biệt token GitHub **cấp client**
(`CopilotClientOptions.gitHubToken`, dùng để xác thực chính
tiến trình CLI) với token **cấp phiên**
(`SessionConfig.gitHubToken`, xác định loại trừ nội dung,
định tuyến mô hình, và hạn mức cho phiên đó, đồng thời được tôn trọng trên cả
`createSession` và `resumeSession`). Harness phân giải xác thực một lần
qua `resolveCopilotAuth` và đặt cả hai trường khi chế độ xác thực là
`gitHubToken` (một `auth.gitHubToken` tường minh hoặc một
`resolvedApiKey` được phân giải theo hợp đồng từ hồ sơ xác thực `github-copilot`
đã cấu hình). Khi chế độ được phân giải là `useLoggedInUser`, trường cấp phiên
bị bỏ qua để SDK tiếp tục dẫn xuất danh tính từ danh tính đã đăng nhập.

`ask_user` dùng `SessionConfig.onUserInputRequest`. Cầu nối chấp nhận
chỉ mục lựa chọn hoặc nhãn cho các yêu cầu lựa chọn cố định, chấp nhận câu trả lời
tự do khi yêu cầu SDK cho phép, và hủy một yêu cầu đang chờ
khi lần thử OpenClaw bị hủy bỏ.

## Liên quan

- [Runtime tác nhân](/vi/concepts/agent-runtimes)
- [Harness Codex](/vi/plugins/codex-harness)
- [Plugin harness tác nhân (tham chiếu SDK)](/vi/plugins/sdk-agent-harness)
