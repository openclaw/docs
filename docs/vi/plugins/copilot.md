---
read_when:
    - Bạn muốn sử dụng bộ khung GitHub Copilot SDK cho một tác tử
    - Bạn cần các ví dụ cấu hình cho môi trường chạy `copilot`
    - Bạn đang kết nối một tác tử với gói đăng ký Copilot (github / openclaw / copilot) và muốn tác tử đó chạy thông qua Copilot CLI
summary: Chạy các lượt tác tử nhúng của OpenClaw thông qua bộ khung GitHub Copilot SDK bên ngoài
title: Bộ khung Copilot SDK
x-i18n:
    generated_at: "2026-07-12T08:07:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

Plugin `@openclaw/copilot` bên ngoài chạy các lượt tác nhân Copilot theo gói thuê bao được nhúng thông qua GitHub Copilot CLI (`@github/copilot-sdk`) thay vì bộ điều phối tích hợp sẵn của OpenClaw. Phiên Copilot CLI sở hữu vòng lặp tác nhân cấp thấp: thực thi công cụ gốc, Compaction gốc (`infiniteSessions`) và trạng thái luồng do CLI quản lý trong `copilotHome`. OpenClaw vẫn sở hữu các kênh trò chuyện, tệp phiên, lựa chọn mô hình, công cụ động (được bắc cầu), phê duyệt, phân phối phương tiện, bản sao bản ghi hội thoại hiển thị, câu hỏi phụ `/btw` (xem [Câu hỏi phụ (`/btw`)](#side-questions-btw)) và `openclaw doctor`.

Để tìm hiểu cách phân chia tổng thể giữa mô hình/nhà cung cấp/môi trường chạy, hãy bắt đầu với [Môi trường chạy của tác nhân](/vi/concepts/agent-runtimes).

## Yêu cầu

- OpenClaw đã cài đặt Plugin `@openclaw/copilot`.
- Nếu cấu hình của bạn sử dụng `plugins.allow`, hãy thêm `copilot` (id manifest mà Plugin khai báo). Mục danh sách cho phép dùng tên gói npm `@openclaw/copilot` sẽ không khớp và khiến Plugin tiếp tục bị chặn, ngay cả khi đã đặt `agentRuntime.id: "copilot"`.
- Gói thuê bao GitHub Copilot có thể vận hành Copilot CLI, hoặc biến môi trường `gitHubToken` / mục hồ sơ xác thực dành cho các lượt chạy không giao diện hoặc Cron.
- Thư mục `copilotHome` có quyền ghi. Mặc định là `<agentDir>/copilot` khi OpenClaw cung cấp thư mục tác nhân, nếu không thì là `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` chạy [hợp đồng doctor](#doctor) của Plugin để quản lý quyền sở hữu trạng thái phiên và các đợt di chuyển cấu hình trong tương lai. Lệnh này không kiểm tra môi trường Copilot CLI.

## Cài đặt

Môi trường chạy Copilot được phân phối dưới dạng Plugin bên ngoài để gói `openclaw` lõi không phải mang theo `@github/copilot-sdk` hoặc tệp nhị phân CLI `@github/copilot-<platform>-<arch>` dành riêng cho nền tảng của nó (tổng cộng khoảng 260 MB). Chỉ cài đặt Plugin này cho các tác nhân chủ động chọn môi trường chạy này:

```bash
openclaw plugins install @openclaw/copilot
```

Trình hướng dẫn thiết lập tự động cài đặt Plugin vào lần đầu tiên bạn chọn mô hình `github-copilot/*` **và** cấu hình của bạn định tuyến mô hình đó (hoặc nhà cung cấp của nó) đến môi trường chạy Copilot qua `agentRuntime: { id: "copilot" }`; xem [Bắt đầu nhanh](#quickstart). Nếu không chủ động chọn, OpenClaw sử dụng nhà cung cấp GitHub Copilot tích hợp sẵn và không bao giờ cài đặt Plugin này.

Môi trường chạy phân giải SDK theo thứ tự sau:

1. `import("@github/copilot-sdk")` từ gói `@openclaw/copilot` đã cài đặt.
2. Thư mục dự phòng `~/.openclaw/npm-runtime/copilot/` (đích cài đặt theo yêu cầu cũ).

Khi thiếu SDK, hệ thống hiển thị một lỗi có mã `COPILOT_SDK_MISSING` cùng lệnh cài đặt lại ở trên.

## Bắt đầu nhanh

Ghim một mô hình (hoặc một nhà cung cấp) vào bộ điều phối:

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

Đặt `agentRuntime.id` trên một mục mô hình riêng lẻ để chỉ định tuyến mô hình đó qua bộ điều phối, hoặc đặt trên một nhà cung cấp để định tuyến mọi mô hình thuộc nhà cung cấp đó.

`github-copilot/auto` là điểm khởi đầu có tính di động. Các mô hình Copilot có tên cụ thể phụ thuộc vào chính sách của tài khoản và tổ chức; hãy xác nhận Copilot CLI đã xác thực của bạn thực sự cung cấp một mô hình trước khi ghim mô hình đó.

## Nhà cung cấp được hỗ trợ

Bộ điều phối hỗ trợ nhà cung cấp `github-copilot` chuẩn (thuộc quyền sở hữu của `extensions/github-copilot`), cùng các mục `models.providers` tùy chỉnh khi mô hình có `baseUrl` không rỗng và một trong các dạng `api` sau:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (hoàn thành tương thích với OpenAI)
- `openai-completions`
- `openai-responses`

Các id nhà cung cấp gốc (`openai`, `anthropic`, `google`, `ollama`) vẫn thuộc quyền sở hữu của môi trường chạy gốc tương ứng. Thay vào đó, hãy dùng một id nhà cung cấp tùy chỉnh riêng biệt để định tuyến một điểm cuối qua Copilot BYOK.

Các điểm cuối Copilot BYOK phải là URL HTTPS công khai. Bộ điều phối cung cấp cho Copilot SDK một proxy local loopback riêng cho từng lần thử, sau đó chuyển tiếp lưu lượng của nhà cung cấp qua đường dẫn tìm nạp được bảo vệ của OpenClaw để việc ghim DNS và chính sách SSRF vẫn do OpenClaw quản lý. Hãy sử dụng môi trường chạy OpenClaw gốc cho Ollama cục bộ, LM Studio hoặc máy chủ mô hình trong mạng LAN.

## BYOK

Copilot BYOK sử dụng hợp đồng nhà cung cấp tùy chỉnh ở cấp phiên của SDK. OpenClaw truyền điểm cuối mô hình đã phân giải, khóa API, chế độ bearer token, tiêu đề, id mô hình và giới hạn ngữ cảnh/đầu ra; logic truyền tải của nhà cung cấp vẫn nằm trong SDK, không nằm trong lõi.

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

Các phiên BYOK được định danh riêng với các phiên gói thuê bao cũng như với các điểm cuối hoặc thông tin xác thực BYOK khác. Việc luân chuyển khóa, tiêu đề, mô hình hoặc điểm cuối sẽ khởi động một phiên Copilot SDK mới thay vì tiếp tục trạng thái không tương thích.

## Xác thực

Thứ tự ưu tiên được áp dụng cho từng tác nhân trong `runCopilotAttempt`:

1. **`useLoggedInUser: true` được chỉ định rõ ràng** trong đầu vào lần thử — sử dụng người dùng đã đăng nhập của Copilot CLI trong `copilotHome` của tác nhân.
2. **`gitHubToken` được chỉ định rõ ràng** trong đầu vào lần thử (yêu cầu `profileId` + `profileVersion`). Dành cho các lần gọi CLI trực tiếp và các kiểm thử cần bỏ qua bước phân giải hồ sơ xác thực.
3. **`resolvedApiKey` + `authProfileId` do hợp đồng phân giải** — đường dẫn chính trong môi trường sản xuất. Lõi phân giải hồ sơ xác thực `github-copilot` đã cấu hình của tác nhân (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) trước khi gọi bộ điều phối, vì vậy hồ sơ xác thực `github-copilot:<profile>` hoạt động xuyên suốt cho các thiết lập không giao diện, Cron hoặc nhiều hồ sơ mà không cần biến môi trường.
4. **Dự phòng bằng biến môi trường**, được kiểm tra theo thứ tự sau (giá trị không rỗng đầu tiên sẽ được dùng, chuỗi rỗng được coi là không có; phản ánh thứ tự ưu tiên của nhà cung cấp `github-copilot` đã phát hành trong `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — giá trị ghi đè dành riêng cho bộ điều phối; cho phép bạn ghim một token cho bộ điều phối OpenClaw mà không làm ảnh hưởng đến cấu hình `gh` / Copilot CLI trên toàn hệ thống.
   2. `COPILOT_GITHUB_TOKEN` — biến môi trường tiêu chuẩn của Copilot SDK / CLI.
   3. `GH_TOKEN` — biến môi trường tiêu chuẩn của CLI `gh`.
   4. `GITHUB_TOKEN` — giá trị token GitHub dự phòng chung.

   Id hồ sơ nhóm được tổng hợp là `env:<NAME>`; phiên bản hồ sơ là dấu vân tay sha256 không thể đảo ngược của token, vì vậy việc luân chuyển giá trị môi trường sẽ làm mới nhóm máy khách một cách sạch sẽ.

5. **`useLoggedInUser` mặc định** khi không có tín hiệu token nào.

Mỗi tác nhân có `copilotHome` riêng để token, phiên và cấu hình của Copilot CLI không bao giờ bị rò rỉ giữa các tác nhân trên cùng một máy. Mặc định: `<agentDir>/copilot` (giữ trạng thái SDK ngoài cùng thư mục với `models.json` / `auth-profiles.json` của OpenClaw), hoặc `~/.openclaw/agents/<agentId>/copilot` khi không cung cấp thư mục tác nhân. Ghi đè bằng `copilotHome: <path>` trong đầu vào lần thử để dùng vị trí tùy chỉnh (ví dụ: một điểm gắn kết dùng chung cho quá trình di chuyển).

Các kiểm thử bộ điều phối trực tiếp sử dụng `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` cho token trực tiếp. Thiết lập kiểm thử trực tiếp dùng chung sẽ xóa `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` và `GITHUB_TOKEN` sau khi đưa các hồ sơ xác thực thực vào thư mục chính kiểm thử biệt lập, nhờ đó giá trị `gh auth token` được truyền qua biến chuyên dụng sẽ tránh bị bỏ qua sai mà không rò rỉ sang các bộ kiểm thử không liên quan.

## Bề mặt cấu hình

Bộ điều phối đọc cấu hình từ đầu vào theo từng lần thử (`runCopilotAttempt({...})`) cùng một tập nhỏ các giá trị mặc định từ môi trường trong `extensions/copilot/src/`:

| Trường                   | Mục đích                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Thư mục trạng thái CLI theo từng tác nhân (mặc định như trên).                                                                                                                                                                                                                                                                                               |
| `model`                  | Chuỗi hoặc `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Bỏ qua để sử dụng lựa chọn mô hình thông thường của tác nhân; bộ điều phối xác minh nhà cung cấp đã phân giải được hỗ trợ.                                                                                                                                                               |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Ánh xạ từ quá trình phân giải `ThinkLevel` / `ReasoningLevel` của OpenClaw trong `auto-reply/thinking.ts`.                                                                                                                                                                                                           |
| `infiniteSessionConfig`  | Giá trị ghi đè tùy chọn cho khối `infiniteSessions` của SDK do `harness.compact` điều khiển. Có thể giữ nguyên một cách an toàn.                                                                                                                                                                                                                              |
| `hooksConfig`            | Cấu hình `SessionHooks` gốc tùy chọn của Copilot SDK dành cho công cụ/MCP, lời nhắc người dùng, phiên và lệnh gọi lại khi có lỗi. Tách biệt với các hook vòng đời có tính di động của OpenClaw.                                                                                                                                                                |
| `permissionPolicy`       | Giá trị ghi đè tùy chọn cho trình xử lý `onPermissionRequest` của SDK đối với các loại công cụ SDK tích hợp sẵn (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Mặc định là `rejectAllPolicy` như một lớp bảo vệ; xem [Quyền và ask_user](#permissions-and-ask_user) để biết lý do trên thực tế nó không bao giờ được kích hoạt. |
| `enableSessionTelemetry` | Cờ đo từ xa phiên SDK tùy chọn.                                                                                                                                                                                                                                                                                                                              |

Các hook Plugin của OpenClaw không cần cấu hình lần thử dành riêng cho Copilot. Bộ điều phối chạy `before_prompt_build` (và hook tương thích cũ `before_agent_start`), `llm_input`, `llm_output` và `agent_end` thông qua các trình trợ giúp tiêu chuẩn của bộ điều phối. Các lần Compaction SDK thành công cũng chạy `before_compaction` và `after_compaction`. Các công cụ OpenClaw được bắc cầu chạy `before_tool_call` và báo cáo `after_tool_call`; `hooksConfig` vẫn dành cho các lệnh gọi lại chỉ có trong SDK gốc mà không có thành phần tương đương có tính di động.

Không phần nào khác trong OpenClaw cần biết về các trường này. Các Plugin, kênh và mã lõi khác chỉ thấy dạng `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` tiêu chuẩn.

## Compaction

Khi `harness.compact` chạy, bộ điều phối Copilot SDK:

1. Tiếp tục phiên SDK đang được theo dõi mà không tiếp tục công việc đang chờ xử lý.
2. Gọi RPC Compaction lịch sử ở phạm vi phiên của SDK.
3. Trả về kết quả Compaction của SDK mà không ghi các tệp đánh dấu tương thích trong không gian làm việc.

Bản sao bản ghi hội thoại phía OpenClaw (bên dưới) tiếp tục nhận các thông báo sau Compaction, vì vậy lịch sử trò chuyện hiển thị cho người dùng vẫn nhất quán.

## Sao chép bản ghi hội thoại

`runCopilotAttempt` ghi kép các thông báo có thể sao chép của mỗi lượt vào bản ghi hội thoại kiểm tra của OpenClaw thông qua `extensions/copilot/src/dual-write-transcripts.ts`. Bản sao được giới hạn theo từng phiên (`copilot:${sessionId}`) và được định danh theo từng thông báo (`${role}:${sha256_16(role,content)}`), vì vậy các mục của lượt trước được phát lại sẽ trùng với các khóa hiện có trên đĩa thay vì bị nhân bản.

Hai lớp ngăn chặn lỗi bao bọc cơ chế phản chiếu để lỗi ghi bản chép lời
không bao giờ làm lần thử thất bại: một trình bao bọc nỗ lực tối đa nội bộ, cùng với
một `.catch(...)` phòng thủ theo chiều sâu ở cấp lần thử. Lỗi được ghi nhật ký, không
được đưa ra ngoài.

## Câu hỏi phụ (`/btw`)

`/btw` **không** được hỗ trợ nguyên bản trên harness này. `createCopilotAgentHarness()`
cố ý để `harness.runSideQuestion` là undefined
(được xác nhận trong `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
vì vậy bộ điều phối `/btw` của OpenClaw (`src/agents/btw.ts`) chuyển sang
cùng đường dẫn được dùng cho mọi runtime không phải Codex: nhà cung cấp mô hình
đã cấu hình được gọi trực tiếp bằng một prompt câu hỏi phụ ngắn và phản hồi được truyền trực tuyến qua
`streamSimple` (không có phiên CLI, không chiếm thêm vị trí trong pool).

Điều này dành riêng các phiên Copilot CLI cho vòng lặp lượt chính của tác nhân, đồng thời
giữ hành vi `/btw` giống hệt các runtime không phải Codex khác.

## Doctor

`extensions/copilot/doctor-contract-api.ts` được tự động tải bởi
`src/plugins/doctor-contract-registry.ts`. Tệp này đóng góp:

- Một `legacyConfigRules` trống (chưa có trường nào bị loại bỏ).
- Một `normalizeCompatibilityConfig` không thực hiện thao tác nào (được giữ lại để các lần loại bỏ trường trong tương lai
  có một vị trí ổn định trong cây mã nguồn).
- Một mục `sessionRouteStateOwners`: nhà cung cấp `github-copilot`, runtime
  `copilot`, khóa phiên CLI `copilot`, tiền tố hồ sơ xác thực `github-copilot:`.

## Hạn chế

- Harness nhận quyền sở hữu `github-copilot` cùng các mã định danh nhà cung cấp BYOK tùy chỉnh chưa có chủ sở hữu.
  Các mã định danh nhà cung cấp nguyên bản do manifest sở hữu vẫn thuộc runtime sở hữu chúng ngay cả khi
  `agentRuntime.id` bị buộc thành `copilot`.
- Không có bề mặt TUI; TUI của PI vẫn là phương án dự phòng cho các runtime không có bề mặt
  ngang hàng.
- Trạng thái phiên PI không được di chuyển khi tác nhân chuyển sang `copilot`.
  Việc lựa chọn diễn ra theo từng lần thử; các phiên PI hiện có vẫn hợp lệ.
- `ask_user` sử dụng cùng đường dẫn prompt-và-phản-hồi của OpenClaw như harness Codex:
  khi Copilot SDK yêu cầu dữ liệu đầu vào từ người dùng, OpenClaw đăng một
  prompt chặn lên kênh/TUI đang hoạt động, và tin nhắn người dùng tiếp theo trong hàng đợi
  sẽ giải quyết yêu cầu SDK.

## Quyền và ask_user

Việc thực thi quyền đối với các công cụ OpenClaw được kết nối diễn ra **bên trong trình bao bọc công cụ**,
không phải thông qua callback `onPermissionRequest` của SDK. Cùng
`wrapToolWithBeforeToolCallHook` mà PI sử dụng
(`src/agents/agent-tools.before-tool-call.ts`) được `createOpenClawCodingTools`
áp dụng cho mọi công cụ lập trình: phát hiện vòng lặp, chính sách Plugin đáng tin cậy,
hook trước khi gọi công cụ và quy trình phê duyệt Plugin hai giai đoạn qua
Gateway (`plugin.approval.request`) đều chạy qua chính xác cùng đường dẫn mã
như các lần thử PI nguyên bản.

Công cụ SDK do `convertOpenClawToolToSdkTool` trả về được đánh dấu bằng:

- `overridesBuiltInTool: true` — thay thế công cụ tích hợp sẵn cùng tên của
  Copilot CLI (edit, read, write, bash, ...) để mọi lệnh gọi công cụ đều được định tuyến trở lại
  OpenClaw.
- `skipPermission: true` — yêu cầu SDK không kích hoạt
  `onPermissionRequest({kind: "custom-tool"})` trước khi gọi công cụ. Hàm
  `execute()` được bao bọc đã thực hiện kiểm tra chính sách OpenClaw phong phú hơn; một
  prompt ở cấp SDK sẽ hoặc bỏ qua việc thực thi của OpenClaw
  (cho phép tất cả), hoặc chặn mọi lệnh gọi công cụ (từ chối tất cả) — cả hai đều không tương đương
  với PI.

Harness Codex trong cây mã nguồn sử dụng cùng cách phân tách: các công cụ OpenClaw được kết nối
được bao bọc (`extensions/codex/src/app-server/dynamic-tools.ts`) và các loại phê duyệt nguyên bản
của chính codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) được định tuyến qua `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Phương thức tương đương của Copilot SDK
— `rejectAllPolicy` đóng khi lỗi đối với bất kỳ loại nào không phải `custom-tool`
mà từng đi đến `onPermissionRequest` — là cùng một lưới an toàn, và trên thực tế nó
không bao giờ được kích hoạt vì `overridesBuiltInTool: true` thay thế mọi
công cụ tích hợp sẵn.

Để lớp công cụ được bao bọc đưa ra quyết định chính sách tương đương với PI,
harness chuyển tiếp toàn bộ ngữ cảnh công cụ của lần thử PI đến
`createOpenClawCodingTools`: danh tính (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), kênh/định tuyến (`groupId`,
`currentChannelId`, `replyToMode`, các công tắc công cụ tin nhắn), xác thực
(`authProfileStore`), danh tính lần chạy (`sessionKey` / `runSessionKey` được suy ra
từ `sandboxSessionKey`, `runId`), ngữ cảnh mô hình (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) và các hook lần chạy
(`onToolOutcome`, `onYield`). Nếu thiếu các trường đó, danh sách cho phép chỉ dành cho chủ sở hữu
sẽ âm thầm từ chối theo mặc định, chính sách tin cậy Plugin không thể phân giải đúng
phạm vi, và `session_status: "current"` phân giải thành khóa sandbox đã cũ. Trình
xây dựng cầu nối là `extensions/copilot/src/tool-bridge.ts`, phản chiếu lệnh gọi có thẩm quyền của PI
tại `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` phân giải ngữ cảnh sandbox thông qua seam
`resolveSandboxContext` dùng chung, truyền cho SDK một thư mục làm việc hiệu lực,
đồng thời chuyển tiếp `sandbox` cùng không gian làm việc tạo tác nhân phụ vào cầu nối
công cụ. Cầu nối cũng chuyển tiếp các cơ chế kiểm soát xây dựng công cụ có giới hạn mà nó
có thể thực thi tại ranh giới SDK: `includeCoreTools`, danh sách cho phép công cụ
của runtime và `toolConstructionPlan`.

Cầu nối cũng sử dụng trình trợ giúp bề mặt công cụ harness dùng chung từ
`openclaw/plugin-sdk/agent-harness-tool-runtime` để đảm bảo tương đương với PI. Khi
tìm kiếm công cụ được bật, SDK thấy các công cụ điều khiển nhỏ gọn cùng một trình thực thi
danh mục ẩn thay vì toàn bộ schema công cụ OpenClaw. Khi chế độ mã
được bật, trình trợ giúp xây dựng cùng bề mặt điều khiển chế độ mã và vòng đời
danh mục mà các harness tác nhân khác sử dụng. Các giá trị mặc định tinh gọn cho mô hình cục bộ,
lọc schema tương thích với runtime, điền dữ liệu thư mục và dọn dẹp danh mục
đều nằm trong trình trợ giúp dùng chung để các harness Copilot và lân cận Codex
không bị sai lệch.

### Token GitHub cấp phiên

Hợp đồng Copilot SDK phân biệt token GitHub **cấp máy khách**
(`CopilotClientOptions.gitHubToken`, xác thực chính tiến trình CLI)
với token **cấp phiên** (`SessionConfig.gitHubToken`, xác định
loại trừ nội dung, định tuyến mô hình và hạn ngạch cho phiên đó; được áp dụng cho
cả `createSession` và `resumeSession`). Harness phân giải xác thực một lần qua
`resolveCopilotAuth` và đặt cả hai trường khi chế độ xác thực là `gitHubToken`
(một `auth.gitHubToken` tường minh hoặc `resolvedApiKey` được hợp đồng phân giải từ
hồ sơ xác thực `github-copilot` đã cấu hình). Khi chế độ đã phân giải là
`useLoggedInUser`, trường cấp phiên bị bỏ qua để SDK tiếp tục
suy ra danh tính từ danh tính đã đăng nhập.

`ask_user` sử dụng `SessionConfig.onUserInputRequest`. Cầu nối chấp nhận chỉ mục
hoặc nhãn lựa chọn cho các yêu cầu có lựa chọn cố định, chấp nhận câu trả lời tự do khi
yêu cầu SDK cho phép, và hủy yêu cầu đang chờ khi lần thử OpenClaw
bị hủy bỏ.

## Liên quan

- [Runtime tác nhân](/vi/concepts/agent-runtimes)
- [Harness Codex](/vi/plugins/codex-harness)
- [Plugin harness tác nhân (tài liệu tham chiếu SDK)](/vi/plugins/sdk-agent-harness)
