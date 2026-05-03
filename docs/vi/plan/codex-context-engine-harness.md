---
read_when:
    - Bạn đang tích hợp hành vi vòng đời của context-engine vào bộ khung Codex
    - Bạn cần lossless-claw hoặc một Plugin công cụ ngữ cảnh khác để làm việc với các phiên bộ khung nhúng codex/*
    - Bạn đang so sánh hành vi ngữ cảnh của PI nhúng và máy chủ ứng dụng Codex
summary: Đặc tả để làm cho harness app-server Codex được đóng gói kèm tuân thủ các Plugin context-engine của OpenClaw
title: Bản chuyển cổng Bộ máy ngữ cảnh Codex Harness
x-i18n:
    generated_at: "2026-05-03T10:39:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Trạng thái

Đặc tả triển khai bản nháp.

## Mục tiêu

Làm cho harness app-server Codex được đóng gói tuân thủ cùng hợp đồng vòng đời context-engine của OpenClaw mà các lượt PI nhúng đã tuân thủ.

Một phiên dùng `agents.defaults.embeddedHarness.runtime: "codex"` hoặc một mô hình `codex/*` vẫn nên cho phép Plugin context-engine đã chọn, chẳng hạn như `lossless-claw`, kiểm soát việc lắp ráp ngữ cảnh, ingest sau lượt, bảo trì và chính sách compaction cấp OpenClaw trong phạm vi ranh giới app-server Codex cho phép.

## Không phải mục tiêu

- Không triển khai lại nội bộ app-server Codex.
- Không làm cho compaction luồng native của Codex tạo ra bản tóm tắt lossless-claw.
- Không yêu cầu các mô hình không phải Codex dùng harness Codex.
- Không thay đổi hành vi phiên ACP/acpx. Đặc tả này chỉ dành cho đường dẫn harness tác nhân nhúng không phải ACP.
- Không bắt các Plugin bên thứ ba đăng ký các factory tiện ích mở rộng app-server Codex; ranh giới tin cậy Plugin được đóng gói hiện có vẫn không đổi.

## Kiến trúc hiện tại

Vòng lặp chạy nhúng phân giải context engine đã cấu hình một lần cho mỗi lần chạy trước khi chọn một harness cấp thấp cụ thể:

- `src/agents/pi-embedded-runner/run.ts`
  - khởi tạo các Plugin context-engine
  - gọi `resolveContextEngine(params.config)`
  - truyền `contextEngine` và `contextTokenBudget` vào `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` ủy quyền cho harness tác nhân đã chọn:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex được Plugin Codex được đóng gói đăng ký:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Triển khai harness Codex nhận cùng `EmbeddedRunAttemptParams` như các lần thử dựa trên PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Điều đó có nghĩa là điểm hook bắt buộc nằm trong mã do OpenClaw kiểm soát. Ranh giới bên ngoài là chính giao thức app-server Codex: OpenClaw có thể kiểm soát nội dung gửi tới `thread/start`, `thread/resume` và `turn/start`, đồng thời có thể quan sát thông báo, nhưng không thể thay đổi kho luồng nội bộ hoặc trình compactor native của Codex.

## Khoảng trống hiện tại

Các lần thử PI nhúng gọi trực tiếp vòng đời context-engine:

- bootstrap/bảo trì trước lần thử
- assemble trước lời gọi mô hình
- afterTurn hoặc ingest sau lần thử
- bảo trì sau một lượt thành công
- compaction context-engine cho các engine sở hữu compaction

Mã PI liên quan:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Các lần thử app-server Codex hiện chạy hook harness tác nhân chung và phản chiếu bản ghi, nhưng không gọi `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` hoặc `params.contextEngine.maintain`.

Mã Codex liên quan:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Hành vi mong muốn

Đối với các lượt harness Codex, OpenClaw nên giữ nguyên vòng đời này:

1. Đọc bản ghi phiên OpenClaw được phản chiếu.
2. Bootstrap context engine đang hoạt động khi có tệp phiên trước đó.
3. Chạy bảo trì bootstrap khi có.
4. Lắp ráp ngữ cảnh bằng context engine đang hoạt động.
5. Chuyển ngữ cảnh đã lắp ráp thành đầu vào tương thích với Codex.
6. Khởi động hoặc tiếp tục luồng Codex với chỉ dẫn developer bao gồm mọi `systemPromptAddition` của context-engine.
7. Khởi động lượt Codex với prompt hướng tới người dùng đã lắp ráp.
8. Phản chiếu kết quả Codex trở lại bản ghi OpenClaw.
9. Gọi `afterTurn` nếu đã triển khai, nếu không thì gọi `ingestBatch`/`ingest`, bằng snapshot bản ghi đã phản chiếu.
10. Chạy bảo trì lượt sau các lượt thành công không bị hủy.
11. Giữ nguyên tín hiệu compaction native của Codex và các hook compaction OpenClaw.

## Ràng buộc thiết kế

### App-server Codex vẫn là nguồn chuẩn cho trạng thái luồng native

Codex sở hữu luồng native của nó và mọi lịch sử mở rộng nội bộ. OpenClaw không nên cố sửa đổi lịch sử nội bộ của app-server ngoài các lời gọi giao thức được hỗ trợ.

Bản sao bản ghi của OpenClaw vẫn là nguồn cho các tính năng OpenClaw:

- lịch sử trò chuyện
- tìm kiếm
- ghi sổ `/new` và `/reset`
- chuyển đổi mô hình hoặc harness trong tương lai
- trạng thái Plugin context-engine

### Việc lắp ráp context engine phải được chiếu thành đầu vào Codex

Giao diện context-engine trả về `AgentMessage[]` của OpenClaw, không phải patch luồng Codex. `turn/start` của app-server Codex chấp nhận đầu vào người dùng hiện tại, trong khi `thread/start` và `thread/resume` chấp nhận chỉ dẫn developer.

Vì vậy, triển khai cần một lớp chiếu. Phiên bản đầu tiên an toàn nên tránh giả định rằng nó có thể thay thế lịch sử nội bộ của Codex. Nó nên chèn ngữ cảnh đã lắp ráp dưới dạng nội dung prompt/chỉ dẫn developer xác định quanh lượt hiện tại.

### Độ ổn định prompt-cache rất quan trọng

Đối với các engine như lossless-claw, ngữ cảnh đã lắp ráp nên xác định khi đầu vào không đổi. Không thêm dấu thời gian, id ngẫu nhiên hoặc thứ tự không xác định vào văn bản ngữ cảnh được tạo.

### Ngữ nghĩa chọn runtime không thay đổi

Việc chọn harness vẫn giữ nguyên:

- `runtime: "pi"` buộc dùng PI
- `runtime: "codex"` chọn harness Codex đã đăng ký
- `runtime: "auto"` cho phép các harness Plugin nhận các provider được hỗ trợ
- các lượt chạy `auto` không khớp dùng PI

Công việc này thay đổi những gì xảy ra sau khi harness Codex được chọn.

## Kế hoạch triển khai

### 1. Xuất hoặc di dời các helper lần thử context-engine có thể tái sử dụng

Hiện nay các helper vòng đời có thể tái sử dụng nằm dưới runner PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex không nên import từ một đường dẫn triển khai có tên hàm ý PI nếu có thể tránh.

Tạo một module trung lập với harness, ví dụ:

- `src/agents/harness/context-engine-lifecycle.ts`

Di chuyển hoặc xuất lại:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- một wrapper nhỏ quanh `runContextEngineMaintenance`

Giữ các import PI hoạt động bằng cách xuất lại từ các tệp cũ hoặc cập nhật các điểm gọi PI trong cùng PR.

Tên helper trung lập không nên nhắc đến PI.

Tên đề xuất:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Thêm helper chiếu ngữ cảnh Codex

Thêm một module mới:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Trách nhiệm:

- Nhận `AgentMessage[]` đã lắp ráp, lịch sử phản chiếu ban đầu và prompt hiện tại.
- Xác định ngữ cảnh nào thuộc về chỉ dẫn developer so với đầu vào người dùng hiện tại.
- Giữ nguyên prompt người dùng hiện tại làm yêu cầu có thể hành động cuối cùng.
- Render các thông điệp trước đó ở định dạng ổn định, rõ ràng.
- Tránh metadata biến động.

API đề xuất:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Cách chiếu đầu tiên được khuyến nghị:

- Đặt `systemPromptAddition` vào chỉ dẫn developer.
- Đặt ngữ cảnh bản ghi đã lắp ráp trước prompt hiện tại trong `promptText`.
- Gắn nhãn rõ là ngữ cảnh đã lắp ráp của OpenClaw.
- Giữ prompt hiện tại ở cuối.
- Loại trừ prompt người dùng hiện tại bị trùng nếu nó đã xuất hiện ở đuôi.

Dạng prompt ví dụ:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Cách này kém thanh lịch hơn so với phẫu thuật lịch sử native của Codex, nhưng có thể triển khai bên trong OpenClaw và giữ nguyên ngữ nghĩa context-engine.

Cải tiến trong tương lai: nếu app-server Codex cung cấp giao thức để thay thế hoặc bổ sung lịch sử luồng, hãy đổi lớp chiếu này sang dùng API đó.

### 3. Nối bootstrap trước khi khởi động luồng Codex

Trong `extensions/codex/src/app-server/run-attempt.ts`:

- Đọc lịch sử phiên phản chiếu như hiện nay.
- Xác định liệu tệp phiên có tồn tại trước lần chạy này hay không. Ưu tiên một helper kiểm tra `fs.stat(params.sessionFile)` trước các lần ghi phản chiếu.
- Mở `SessionManager` hoặc dùng adapter session manager hẹp nếu helper yêu cầu.
- Gọi helper bootstrap trung lập khi `params.contextEngine` tồn tại.

Luồng giả:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Dùng cùng quy ước `sessionKey` như cầu nối công cụ Codex và bản sao bản ghi. Hiện Codex tính `sandboxSessionKey` từ `params.sessionKey` hoặc `params.sessionId`; hãy dùng nhất quán giá trị đó trừ khi có lý do để giữ nguyên `params.sessionKey` thô.

### 4. Nối assemble trước `thread/start` / `thread/resume` và `turn/start`

Trong `runCodexAppServerAttempt`:

1. Xây dựng công cụ động trước, để context engine thấy tên các công cụ thực sự có sẵn.
2. Đọc lịch sử phiên phản chiếu.
3. Chạy `assemble(...)` của context-engine khi `params.contextEngine` tồn tại.
4. Chiếu kết quả đã lắp ráp thành:
   - phần bổ sung chỉ dẫn developer
   - văn bản prompt cho `turn/start`

Lời gọi hook hiện có:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

nên trở nên có nhận biết ngữ cảnh:

1. tính chỉ dẫn developer cơ sở bằng `buildDeveloperInstructions(params)`
2. áp dụng assembly/chiếu context-engine
3. chạy `before_prompt_build` với prompt/chỉ dẫn developer đã chiếu

Thứ tự này cho phép các hook prompt chung thấy cùng prompt mà Codex sẽ nhận. Nếu cần độ tương đương PI nghiêm ngặt, hãy chạy assembly context-engine trước khi hợp thành hook, vì PI áp dụng `systemPromptAddition` của context-engine vào prompt hệ thống cuối cùng sau pipeline prompt của nó. Bất biến quan trọng là cả context engine và hook đều có một thứ tự xác định, được tài liệu hóa.

Thứ tự được khuyến nghị cho triển khai đầu tiên:

1. `buildDeveloperInstructions(params)`
2. `assemble()` của context-engine
3. thêm `systemPromptAddition` vào đầu/cuối chỉ dẫn developer
4. chiếu các thông điệp đã lắp ráp vào văn bản prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. truyền chỉ dẫn developer cuối cùng vào `startOrResumeThread(...)`
7. truyền văn bản prompt cuối cùng vào `buildTurnStartParams(...)`

Đặc tả nên được mã hóa trong test để các thay đổi tương lai không vô tình sắp xếp lại thứ tự.

### 5. Giữ định dạng ổn định cho prompt-cache

Helper chiếu phải tạo đầu ra ổn định ở cấp byte cho các đầu vào giống hệt nhau:

- thứ tự thông điệp ổn định
- nhãn vai trò ổn định
- không có dấu thời gian được tạo
- không rò rỉ thứ tự khóa object
- không có delimiter ngẫu nhiên
- không có id theo từng lần chạy

Dùng delimiter cố định và các phần rõ ràng.

### 6. Nối post-turn sau khi phản chiếu bản ghi

`CodexAppServerEventProjector` của Codex xây dựng một `messagesSnapshot` cục bộ cho
lượt hiện tại. `mirrorTranscriptBestEffort(...)` ghi snapshot đó vào bản sao
transcript của OpenClaw.

Sau khi sao chép thành công hoặc thất bại, hãy gọi finalizer của context-engine với
snapshot thông điệp tốt nhất hiện có:

- Ưu tiên ngữ cảnh phiên đã được sao chép đầy đủ sau khi ghi, vì `afterTurn`
  mong đợi snapshot phiên, không chỉ lượt hiện tại.
- Quay lại dùng `historyMessages + result.messagesSnapshot` nếu không thể mở lại
  tệp phiên.

Luồng giả:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Nếu sao chép thất bại, vẫn gọi `afterTurn` với snapshot dự phòng, nhưng ghi log
rằng context engine đang ingest từ dữ liệu lượt dự phòng.

### 7. Chuẩn hóa usage và ngữ cảnh runtime prompt-cache

Kết quả Codex bao gồm usage đã chuẩn hóa từ thông báo token của app-server khi
có sẵn. Truyền usage đó vào ngữ cảnh runtime của context-engine.

Nếu Codex app-server cuối cùng phơi bày chi tiết đọc/ghi cache, hãy ánh xạ chúng vào
`ContextEnginePromptCacheInfo`. Cho đến lúc đó, hãy bỏ qua `promptCache` thay vì
tự tạo các giá trị zero.

### 8. Chính sách Compaction

Có hai hệ thống Compaction:

1. `compact()` của context-engine OpenClaw
2. `thread/compact/start` gốc của Codex app-server

Không âm thầm trộn lẫn chúng.

#### `/compact` và Compaction OpenClaw rõ ràng

Khi context engine được chọn có `info.ownsCompaction === true`, Compaction
OpenClaw rõ ràng nên ưu tiên kết quả `compact()` của context engine cho bản sao
transcript OpenClaw và trạng thái Plugin.

Khi Codex harness được chọn có liên kết thread gốc, chúng ta cũng có thể yêu cầu
Compaction gốc của Codex để giữ cho thread app-server khỏe mạnh, nhưng việc này
phải được báo cáo như một hành động backend riêng trong phần chi tiết.

Hành vi khuyến nghị:

- Nếu `contextEngine.info.ownsCompaction === true`:
  - gọi `compact()` của context-engine trước
  - sau đó gọi best-effort Compaction gốc của Codex khi có liên kết thread
  - trả về kết quả context-engine làm kết quả chính
  - bao gồm trạng thái Compaction gốc của Codex trong `details.codexNativeCompaction`
- Nếu context engine đang hoạt động không sở hữu Compaction:
  - giữ nguyên hành vi Compaction gốc hiện tại của Codex

Việc này có thể yêu cầu thay đổi `extensions/codex/src/app-server/compact.ts` hoặc
bọc nó từ đường dẫn Compaction chung, tùy thuộc vào nơi
`maybeCompactAgentHarnessSession(...)` được gọi.

#### Sự kiện contextCompaction gốc của Codex trong lượt

Codex có thể phát ra các sự kiện item `contextCompaction` trong một lượt. Giữ nguyên
việc phát hook Compaction trước/sau hiện tại trong `event-projector.ts`, nhưng không
xem đó là một Compaction context-engine đã hoàn tất.

Đối với các engine sở hữu Compaction, phát một chẩn đoán rõ ràng khi Codex vẫn thực hiện
Compaction gốc:

- tên stream/sự kiện: stream `compaction` hiện có là chấp nhận được
- chi tiết: `{ backend: "codex-app-server", ownsCompaction: true }`

Điều này làm cho sự tách biệt có thể kiểm toán được.

### 9. Hành vi đặt lại phiên và binding

`reset(...)` hiện có của Codex harness xóa binding Codex app-server khỏi
tệp phiên OpenClaw. Giữ nguyên hành vi đó.

Đồng thời bảo đảm việc dọn dẹp trạng thái context-engine tiếp tục diễn ra thông qua
các đường dẫn vòng đời phiên OpenClaw hiện có. Không thêm dọn dẹp riêng cho Codex trừ khi
vòng đời context-engine hiện bỏ sót sự kiện reset/delete cho tất cả harness.

### 10. Xử lý lỗi

Tuân theo ngữ nghĩa PI:

- lỗi bootstrap cảnh báo và tiếp tục
- lỗi assemble cảnh báo và quay lại dùng thông điệp/prompt pipeline chưa assemble
- lỗi afterTurn/ingest cảnh báo và đánh dấu finalization sau lượt là không thành công
- maintenance chỉ chạy sau các lượt thành công, không aborted, không yield
- lỗi Compaction không nên được thử lại như prompt mới

Bổ sung riêng cho Codex:

- Nếu projection ngữ cảnh thất bại, cảnh báo và quay lại prompt gốc.
- Nếu bản sao transcript thất bại, vẫn thử finalization context-engine với
  thông điệp dự phòng.
- Nếu Compaction gốc của Codex thất bại sau khi Compaction context-engine thành công,
  không làm thất bại toàn bộ Compaction OpenClaw khi context engine là chính.

## Kế hoạch kiểm thử

### Kiểm thử đơn vị

Thêm kiểm thử dưới `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex gọi `bootstrap` khi tồn tại tệp phiên.
   - Codex gọi `assemble` với thông điệp đã sao chép, token budget, tên công cụ,
     chế độ citations, model id, và prompt.
   - `systemPromptAddition` được đưa vào developer instructions.
   - Thông điệp đã assemble được project vào prompt trước yêu cầu hiện tại.
   - Codex gọi `afterTurn` sau khi sao chép transcript.
   - Khi không có `afterTurn`, Codex gọi `ingestBatch` hoặc `ingest` theo từng thông điệp.
   - Turn maintenance chạy sau các lượt thành công.
   - Turn maintenance không chạy khi có lỗi prompt, abort, hoặc yield abort.

2. `context-engine-projection.test.ts`
   - đầu ra ổn định cho các đầu vào giống hệt nhau
   - không trùng lặp prompt hiện tại khi lịch sử đã assemble đã bao gồm nó
   - xử lý lịch sử rỗng
   - giữ nguyên thứ tự vai trò
   - chỉ bao gồm system prompt addition trong developer instructions

3. `compact.context-engine.test.ts`
   - kết quả chính của context engine sở hữu sẽ thắng
   - trạng thái Compaction gốc của Codex xuất hiện trong chi tiết khi cũng được thử
   - lỗi gốc của Codex không làm thất bại Compaction context-engine sở hữu
   - context engine không sở hữu giữ nguyên hành vi Compaction gốc hiện tại

### Kiểm thử hiện có cần cập nhật

- `extensions/codex/src/app-server/run-attempt.test.ts` nếu có, nếu không thì
  các kiểm thử chạy Codex app-server gần nhất.
- `extensions/codex/src/app-server/event-projector.test.ts` chỉ khi chi tiết sự kiện
  Compaction thay đổi.
- `src/agents/harness/selection.test.ts` không nên cần thay đổi trừ khi hành vi
  cấu hình thay đổi; nó nên tiếp tục ổn định.
- Các kiểm thử context-engine PI nên tiếp tục pass mà không đổi.

### Kiểm thử tích hợp / live

Thêm hoặc mở rộng các smoke test live cho Codex harness:

- cấu hình `plugins.slots.contextEngine` thành một engine kiểm thử
- cấu hình `agents.defaults.model` thành một model `codex/*`
- cấu hình `agents.defaults.embeddedHarness.runtime = "codex"`
- assert engine kiểm thử đã quan sát:
  - bootstrap
  - assemble
  - afterTurn hoặc ingest
  - maintenance

Tránh yêu cầu lossless-claw trong kiểm thử core OpenClaw. Dùng một Plugin context engine giả
nhỏ trong repo.

## Khả năng quan sát

Thêm debug log quanh các lệnh gọi vòng đời context-engine của Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` với lý do
- `codex native compaction completed alongside context-engine compaction`

Tránh ghi log toàn bộ prompt hoặc nội dung transcript.

Thêm các trường có cấu trúc khi hữu ích:

- `sessionId`
- `sessionKey` được che hoặc bỏ qua theo thực hành logging hiện có
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / tương thích

Việc này nên tương thích ngược:

- Nếu không cấu hình context engine, hành vi context engine legacy nên tương đương
  với hành vi Codex harness hiện nay.
- Nếu `assemble` của context-engine thất bại, Codex nên tiếp tục với đường dẫn
  prompt gốc.
- Các binding thread Codex hiện có nên vẫn hợp lệ.
- Dynamic tool fingerprinting không nên bao gồm đầu ra context-engine; nếu không
  mỗi thay đổi ngữ cảnh có thể buộc tạo thread Codex mới. Chỉ tool catalog
  nên ảnh hưởng đến dynamic tool fingerprint.

## Câu hỏi mở

1. Ngữ cảnh đã assemble nên được chèn hoàn toàn vào user prompt, hoàn toàn vào
   developer instructions, hay chia ra?

   Khuyến nghị: chia ra. Đặt `systemPromptAddition` trong developer instructions;
   đặt ngữ cảnh transcript đã assemble trong wrapper user prompt. Cách này khớp nhất
   với giao thức Codex hiện tại mà không sửa đổi lịch sử thread gốc.

2. Có nên tắt Compaction gốc của Codex khi một context engine sở hữu
   Compaction không?

   Khuyến nghị: không, ít nhất là ban đầu. Compaction gốc của Codex vẫn có thể
   cần thiết để giữ cho thread app-server hoạt động. Nhưng nó phải được báo cáo là
   Compaction Codex gốc, không phải Compaction context-engine.

3. `before_prompt_build` nên chạy trước hay sau assembly context-engine?

   Khuyến nghị: sau projection context-engine cho Codex, để các hook harness chung
   thấy prompt/developer instructions thực tế mà Codex sẽ nhận. Nếu tương đương PI
   yêu cầu điều ngược lại, hãy mã hóa thứ tự đã chọn trong kiểm thử và ghi lại ở đây.

4. Codex app-server có thể chấp nhận override ngữ cảnh/lịch sử có cấu trúc trong tương lai không?

   Chưa biết. Nếu có thể, hãy thay lớp projection văn bản bằng giao thức đó và
   giữ nguyên các lệnh gọi vòng đời.

## Tiêu chí chấp nhận

- Một lượt embedded harness `codex/*` gọi vòng đời assemble của context engine
  được chọn.
- `systemPromptAddition` của context-engine ảnh hưởng đến developer instructions của Codex.
- Ngữ cảnh đã assemble ảnh hưởng đến đầu vào lượt Codex một cách xác định.
- Các lượt Codex thành công gọi `afterTurn` hoặc ingest dự phòng.
- Các lượt Codex thành công chạy turn maintenance của context-engine.
- Các lượt thất bại/aborted/yield-aborted không chạy turn maintenance.
- Compaction do context-engine sở hữu vẫn là chính cho trạng thái OpenClaw/Plugin.
- Compaction gốc của Codex vẫn có thể kiểm toán như hành vi Codex gốc.
- Hành vi context-engine PI hiện có không đổi.
- Hành vi Codex harness hiện có không đổi khi không chọn context engine không legacy
  hoặc khi assembly thất bại.
