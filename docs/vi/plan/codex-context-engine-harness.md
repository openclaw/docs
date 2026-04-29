---
read_when:
    - Bạn đang tích hợp hành vi vòng đời của công cụ ngữ cảnh vào bộ khung Codex
    - Bạn cần lossless-claw hoặc một Plugin bộ máy ngữ cảnh khác để làm việc với các phiên khung điều khiển nhúng codex/*
    - Bạn đang so sánh hành vi ngữ cảnh của PI nhúng và máy chủ ứng dụng Codex
summary: Đặc tả để bộ harness app-server Codex đi kèm tôn trọng các plugin context-engine của OpenClaw
title: Bản chuyển Context Engine sang Codex Harness
x-i18n:
    generated_at: "2026-04-29T22:56:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Trạng thái

Đặc tả triển khai dạng bản nháp.

## Mục tiêu

Làm cho harness app-server Codex đi kèm tuân thủ cùng hợp đồng vòng đời công cụ ngữ cảnh của OpenClaw
mà các lượt PI nhúng đã tuân thủ.

Một phiên dùng `agents.defaults.embeddedHarness.runtime: "codex"` hoặc một
model `codex/*` vẫn phải cho phép Plugin công cụ ngữ cảnh đã chọn, chẳng hạn
`lossless-claw`, kiểm soát việc lắp ráp ngữ cảnh, nạp sau lượt, bảo trì, và
chính sách Compaction cấp OpenClaw trong phạm vi ranh giới app-server Codex cho phép.

## Ngoài phạm vi

- Không triển khai lại phần nội bộ của app-server Codex.
- Không làm cho Compaction thread native của Codex tạo ra bản tóm tắt lossless-claw.
- Không yêu cầu các model không phải Codex dùng harness Codex.
- Không thay đổi hành vi phiên ACP/acpx. Đặc tả này chỉ dành cho đường dẫn
  harness agent nhúng không phải ACP.
- Không để Plugin bên thứ ba đăng ký các factory tiện ích mở rộng app-server Codex;
  ranh giới tin cậy Plugin đi kèm hiện có vẫn giữ nguyên.

## Kiến trúc hiện tại

Vòng lặp chạy nhúng phân giải công cụ ngữ cảnh đã cấu hình một lần cho mỗi lượt chạy trước khi
chọn một harness cấp thấp cụ thể:

- `src/agents/pi-embedded-runner/run.ts`
  - khởi tạo các Plugin công cụ ngữ cảnh
  - gọi `resolveContextEngine(params.config)`
  - truyền `contextEngine` và `contextTokenBudget` vào
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` ủy quyền cho harness agent đã chọn:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Harness app-server Codex được đăng ký bởi Plugin Codex đi kèm:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Triển khai harness Codex nhận cùng `EmbeddedRunAttemptParams`
như các lượt thử dựa trên PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Điều đó có nghĩa điểm hook bắt buộc nằm trong mã do OpenClaw kiểm soát. Ranh giới bên ngoài
là chính giao thức app-server Codex: OpenClaw có thể kiểm soát nội dung nó
gửi tới `thread/start`, `thread/resume`, và `turn/start`, và có thể quan sát
thông báo, nhưng không thể thay đổi kho thread nội bộ hoặc bộ Compaction native
của Codex.

## Khoảng trống hiện tại

Các lượt thử PI nhúng gọi trực tiếp vòng đời công cụ ngữ cảnh:

- bootstrap/bảo trì trước lượt thử
- lắp ráp trước lệnh gọi model
- afterTurn hoặc nạp sau lượt thử
- bảo trì sau một lượt thành công
- Compaction công cụ ngữ cảnh cho các công cụ sở hữu Compaction

Mã PI liên quan:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Các lượt thử app-server Codex hiện chạy các hook harness agent chung và phản chiếu
bản ghi hội thoại, nhưng không gọi `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, hoặc
`params.contextEngine.maintain`.

Mã Codex liên quan:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Hành vi mong muốn

Đối với các lượt harness Codex, OpenClaw nên bảo toàn vòng đời này:

1. Đọc bản ghi phiên OpenClaw đã phản chiếu.
2. Bootstrap công cụ ngữ cảnh đang hoạt động khi có tệp phiên trước đó.
3. Chạy bảo trì bootstrap khi có.
4. Lắp ráp ngữ cảnh bằng công cụ ngữ cảnh đang hoạt động.
5. Chuyển đổi ngữ cảnh đã lắp ráp thành đầu vào tương thích với Codex.
6. Bắt đầu hoặc tiếp tục thread Codex với chỉ dẫn dành cho nhà phát triển bao gồm mọi
   `systemPromptAddition` của công cụ ngữ cảnh.
7. Bắt đầu lượt Codex với prompt hướng tới người dùng đã lắp ráp.
8. Phản chiếu kết quả Codex trở lại bản ghi OpenClaw.
9. Gọi `afterTurn` nếu được triển khai, nếu không thì `ingestBatch`/`ingest`, bằng
   snapshot bản ghi đã phản chiếu.
10. Chạy bảo trì lượt sau các lượt thành công và không bị hủy.
11. Bảo toàn tín hiệu Compaction native của Codex và các hook Compaction của OpenClaw.

## Ràng buộc thiết kế

### app-server Codex vẫn là nguồn chuẩn cho trạng thái thread native

Codex sở hữu thread native của nó và mọi lịch sử mở rộng nội bộ. OpenClaw không nên
cố biến đổi lịch sử nội bộ của app-server ngoại trừ qua các lệnh gọi giao thức
được hỗ trợ.

Bản phản chiếu bản ghi của OpenClaw vẫn là nguồn cho các tính năng OpenClaw:

- lịch sử trò chuyện
- tìm kiếm
- sổ sách cho `/new` và `/reset`
- chuyển đổi model hoặc harness trong tương lai
- trạng thái Plugin công cụ ngữ cảnh

### Việc lắp ráp công cụ ngữ cảnh phải được chiếu vào đầu vào Codex

Giao diện công cụ ngữ cảnh trả về `AgentMessage[]` của OpenClaw, không phải một
bản vá thread Codex. `turn/start` của app-server Codex chấp nhận một đầu vào người dùng hiện tại, trong khi
`thread/start` và `thread/resume` chấp nhận chỉ dẫn dành cho nhà phát triển.

Vì vậy việc triển khai cần một lớp chiếu. Phiên bản đầu tiên an toàn
nên tránh giả vờ rằng nó có thể thay thế lịch sử nội bộ của Codex. Nó nên chèn
ngữ cảnh đã lắp ráp làm nội dung prompt/chỉ dẫn dành cho nhà phát triển xác định quanh
lượt hiện tại.

### Tính ổn định của bộ nhớ đệm prompt là quan trọng

Đối với các công cụ như lossless-claw, ngữ cảnh đã lắp ráp nên có tính xác định
khi đầu vào không đổi. Không thêm dấu thời gian, id ngẫu nhiên, hoặc thứ tự
không xác định vào văn bản ngữ cảnh được tạo.

### Ngữ nghĩa fallback PI không thay đổi

Lựa chọn harness giữ nguyên như hiện tại:

- `runtime: "pi"` buộc dùng PI
- `runtime: "codex"` chọn harness Codex đã đăng ký
- `runtime: "auto"` cho phép các harness Plugin nhận các provider được hỗ trợ
- `fallback: "none"` tắt fallback PI khi không có harness Plugin nào khớp

Công việc này thay đổi những gì xảy ra sau khi harness Codex được chọn.

## Kế hoạch triển khai

### 1. Xuất hoặc di chuyển các helper lượt thử công cụ ngữ cảnh có thể tái sử dụng

Hiện nay các helper vòng đời có thể tái sử dụng nằm dưới runner PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex không nên import từ một đường dẫn triển khai có tên ngụ ý PI nếu chúng ta
có thể tránh điều đó.

Tạo một module trung lập với harness, ví dụ:

- `src/agents/harness/context-engine-lifecycle.ts`

Di chuyển hoặc tái xuất:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- một wrapper nhỏ quanh `runContextEngineMaintenance`

Giữ các import PI tiếp tục hoạt động bằng cách tái xuất từ các tệp cũ hoặc cập nhật
các điểm gọi PI trong cùng PR.

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

- Nhận `AgentMessage[]` đã lắp ráp, lịch sử đã phản chiếu ban đầu, và prompt hiện tại.
- Xác định ngữ cảnh nào thuộc về chỉ dẫn dành cho nhà phát triển so với đầu vào người dùng hiện tại.
- Bảo toàn prompt người dùng hiện tại làm yêu cầu có thể hành động cuối cùng.
- Render các tin nhắn trước đó theo một định dạng ổn định, rõ ràng.
- Tránh metadata dễ biến động.

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

Phép chiếu đầu tiên được khuyến nghị:

- Đưa `systemPromptAddition` vào chỉ dẫn dành cho nhà phát triển.
- Đưa ngữ cảnh bản ghi đã lắp ráp vào trước prompt hiện tại trong `promptText`.
- Gắn nhãn rõ ràng là ngữ cảnh đã lắp ráp của OpenClaw.
- Giữ prompt hiện tại ở cuối.
- Loại trừ prompt người dùng hiện tại bị trùng nếu nó đã xuất hiện ở phần đuôi.

Ví dụ hình dạng prompt:

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

Cách này kém thanh lịch hơn so với phẫu thuật lịch sử native của Codex, nhưng có thể triển khai
bên trong OpenClaw và bảo toàn ngữ nghĩa công cụ ngữ cảnh.

Cải tiến trong tương lai: nếu app-server Codex công bố một giao thức để thay thế hoặc
bổ sung lịch sử thread, hãy đổi lớp chiếu này sang dùng API đó.

### 3. Nối bootstrap trước khi khởi động thread Codex

Trong `extensions/codex/src/app-server/run-attempt.ts`:

- Đọc lịch sử phiên đã phản chiếu như hiện nay.
- Xác định tệp phiên đã tồn tại trước lượt chạy này hay chưa. Ưu tiên một helper
  kiểm tra `fs.stat(params.sessionFile)` trước khi ghi phản chiếu.
- Mở một `SessionManager` hoặc dùng một adapter trình quản lý phiên hẹp nếu helper
  yêu cầu.
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

Dùng cùng quy ước `sessionKey` như cầu nối công cụ Codex và bản phản chiếu bản ghi.
Hiện nay Codex tính `sandboxSessionKey` từ `params.sessionKey` hoặc
`params.sessionId`; hãy dùng nhất quán giá trị đó trừ khi có lý do để giữ
`params.sessionKey` thô.

### 4. Nối assemble trước `thread/start` / `thread/resume` và `turn/start`

Trong `runCodexAppServerAttempt`:

1. Xây dựng công cụ động trước, để công cụ ngữ cảnh thấy đúng các
   tên công cụ có sẵn thực tế.
2. Đọc lịch sử phiên đã phản chiếu.
3. Chạy `assemble(...)` của công cụ ngữ cảnh khi `params.contextEngine` tồn tại.
4. Chiếu kết quả đã lắp ráp thành:
   - phần bổ sung chỉ dẫn dành cho nhà phát triển
   - văn bản prompt cho `turn/start`

Lệnh gọi hook hiện có:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

nên trở nên nhận biết ngữ cảnh:

1. tính chỉ dẫn dành cho nhà phát triển cơ sở bằng `buildDeveloperInstructions(params)`
2. áp dụng lắp ráp/chiếu công cụ ngữ cảnh
3. chạy `before_prompt_build` với prompt/chỉ dẫn dành cho nhà phát triển đã chiếu

Thứ tự này cho phép các hook prompt chung nhìn thấy cùng prompt mà Codex sẽ nhận. Nếu
cần tương đương PI nghiêm ngặt, hãy chạy lắp ráp công cụ ngữ cảnh trước khi hợp thành hook,
vì PI áp dụng `systemPromptAddition` của công cụ ngữ cảnh vào system prompt cuối cùng
sau pipeline prompt của nó. Bất biến quan trọng là cả công cụ ngữ cảnh và hook
đều có một thứ tự xác định, được tài liệu hóa.

Thứ tự được khuyến nghị cho triển khai đầu tiên:

1. `buildDeveloperInstructions(params)`
2. `assemble()` của công cụ ngữ cảnh
3. thêm vào trước/sau `systemPromptAddition` trong chỉ dẫn dành cho nhà phát triển
4. chiếu các tin nhắn đã lắp ráp vào văn bản prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. truyền chỉ dẫn dành cho nhà phát triển cuối cùng cho `startOrResumeThread(...)`
7. truyền văn bản prompt cuối cùng cho `buildTurnStartParams(...)`

Đặc tả này nên được mã hóa trong test để các thay đổi tương lai không vô tình
sắp xếp lại nó.

### 5. Bảo toàn định dạng ổn định cho bộ nhớ đệm prompt

Helper chiếu phải tạo đầu ra ổn định từng byte cho các đầu vào giống hệt nhau:

- thứ tự tin nhắn ổn định
- nhãn vai trò ổn định
- không tạo dấu thời gian
- không rò rỉ thứ tự khóa object
- không delimiter ngẫu nhiên
- không id theo từng lượt chạy

Dùng delimiter cố định và các phần rõ ràng.

### 6. Nối sau lượt sau khi phản chiếu bản ghi

Codex's `CodexAppServerEventProjector` xây dựng một `messagesSnapshot` cục bộ cho lượt
hiện tại. `mirrorTranscriptBestEffort(...)` ghi snapshot đó vào mirror bản ghi hội thoại
OpenClaw.

Sau khi mirror thành công hoặc thất bại, hãy gọi finalizer của context-engine với
snapshot tin nhắn tốt nhất hiện có:

- Ưu tiên toàn bộ ngữ cảnh phiên đã mirror sau khi ghi, vì `afterTurn`
  mong đợi snapshot phiên, không chỉ lượt hiện tại.
- Dự phòng về `historyMessages + result.messagesSnapshot` nếu không thể mở lại
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

Nếu mirror thất bại, vẫn gọi `afterTurn` với snapshot dự phòng, nhưng ghi log
rằng context engine đang nạp từ dữ liệu lượt dự phòng.

### 7. Chuẩn hóa ngữ cảnh runtime của usage và prompt-cache

Kết quả Codex bao gồm usage đã chuẩn hóa từ thông báo token của app-server khi
có sẵn. Truyền usage đó vào ngữ cảnh runtime của context-engine.

Nếu app-server Codex sau này công khai chi tiết đọc/ghi cache, hãy ánh xạ chúng vào
`ContextEnginePromptCacheInfo`. Cho đến lúc đó, hãy bỏ qua `promptCache` thay vì
tự tạo các giá trị zero.

### 8. Chính sách Compaction

Có hai hệ thống Compaction:

1. `compact()` của context-engine OpenClaw
2. `thread/compact/start` native của app-server Codex

Đừng âm thầm gộp chúng với nhau.

#### `/compact` và Compaction OpenClaw tường minh

Khi context engine đã chọn có `info.ownsCompaction === true`, Compaction OpenClaw
tường minh nên ưu tiên kết quả `compact()` của context engine cho mirror bản ghi hội thoại
OpenClaw và trạng thái plugin.

Khi harness Codex đã chọn có binding thread native, chúng ta có thể yêu cầu thêm
Compaction native Codex theo best-effort để giữ thread app-server khỏe, nhưng việc này
phải được báo cáo như một hành động backend riêng trong chi tiết.

Hành vi khuyến nghị:

- Nếu `contextEngine.info.ownsCompaction === true`:
  - gọi `compact()` của context-engine trước
  - sau đó gọi Compaction native Codex theo best-effort khi có binding thread
  - trả về kết quả context-engine làm kết quả chính
  - bao gồm trạng thái Compaction native Codex trong `details.codexNativeCompaction`
- Nếu context engine đang hoạt động không sở hữu Compaction:
  - giữ nguyên hành vi Compaction native Codex hiện tại

Việc này có thể cần thay đổi `extensions/codex/src/app-server/compact.ts` hoặc
bọc nó từ đường dẫn Compaction chung, tùy vào nơi
`maybeCompactAgentHarnessSession(...)` được gọi.

#### Sự kiện contextCompaction native Codex trong lượt

Codex có thể phát các sự kiện mục `contextCompaction` trong một lượt. Giữ nguyên
việc phát hook Compaction before/after hiện tại trong `event-projector.ts`, nhưng đừng xem
đó là một Compaction context-engine đã hoàn tất.

Đối với các engine sở hữu Compaction, phát một chẩn đoán tường minh khi Codex vẫn thực hiện
Compaction native:

- tên stream/event: stream `compaction` hiện có là chấp nhận được
- chi tiết: `{ backend: "codex-app-server", ownsCompaction: true }`

Việc này giúp phần tách biệt có thể được kiểm toán.

### 9. Hành vi reset phiên và binding

`reset(...)` hiện có của harness Codex xóa binding app-server Codex khỏi
tệp phiên OpenClaw. Giữ nguyên hành vi đó.

Cũng bảo đảm việc dọn dẹp trạng thái context-engine tiếp tục diễn ra qua các
đường dẫn vòng đời phiên OpenClaw hiện có. Đừng thêm dọn dẹp riêng cho Codex trừ khi
vòng đời context-engine hiện đang bỏ lỡ sự kiện reset/delete cho tất cả harness.

### 10. Xử lý lỗi

Tuân theo ngữ nghĩa PI:

- lỗi bootstrap cảnh báo và tiếp tục
- lỗi assemble cảnh báo và dự phòng về prompt/tin nhắn pipeline chưa assemble
- lỗi afterTurn/ingest cảnh báo và đánh dấu finalization sau lượt không thành công
- maintenance chỉ chạy sau các lượt thành công, không bị abort và không bị yield
- lỗi Compaction không nên được thử lại như prompt mới

Bổ sung riêng cho Codex:

- Nếu projection ngữ cảnh thất bại, cảnh báo và dự phòng về prompt gốc.
- Nếu mirror bản ghi hội thoại thất bại, vẫn thử finalization context-engine với
  tin nhắn dự phòng.
- Nếu Compaction native Codex thất bại sau khi Compaction context-engine thành công,
  đừng làm hỏng toàn bộ Compaction OpenClaw khi context engine là chính.

## Kế hoạch kiểm thử

### Kiểm thử đơn vị

Thêm kiểm thử dưới `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex gọi `bootstrap` khi có tệp phiên.
   - Codex gọi `assemble` với tin nhắn đã mirror, token budget, tên công cụ,
     chế độ citations, model id và prompt.
   - `systemPromptAddition` được bao gồm trong developer instructions.
   - Tin nhắn đã assemble được project vào prompt trước yêu cầu hiện tại.
   - Codex gọi `afterTurn` sau khi mirror bản ghi hội thoại.
   - Khi không có `afterTurn`, Codex gọi `ingestBatch` hoặc `ingest` theo từng tin nhắn.
   - Turn maintenance chạy sau các lượt thành công.
   - Turn maintenance không chạy khi có lỗi prompt, abort hoặc yield abort.

2. `context-engine-projection.test.ts`
   - đầu ra ổn định cho các input giống hệt nhau
   - không trùng lặp prompt hiện tại khi lịch sử đã assemble đã bao gồm nó
   - xử lý lịch sử rỗng
   - giữ nguyên thứ tự role
   - chỉ bao gồm bổ sung system prompt trong developer instructions

3. `compact.context-engine.test.ts`
   - kết quả chính của context engine sở hữu sẽ thắng
   - trạng thái Compaction native Codex xuất hiện trong chi tiết khi cũng được thử
   - lỗi native Codex không làm hỏng Compaction context-engine sở hữu
   - context engine không sở hữu giữ nguyên hành vi Compaction native hiện tại

### Kiểm thử hiện có cần cập nhật

- `extensions/codex/src/app-server/run-attempt.test.ts` nếu có, nếu không thì
  các kiểm thử chạy app-server Codex gần nhất.
- `extensions/codex/src/app-server/event-projector.test.ts` chỉ khi chi tiết sự kiện
  Compaction thay đổi.
- `src/agents/harness/selection.test.ts` không cần thay đổi trừ khi hành vi cấu hình
  thay đổi; nó nên giữ ổn định.
- Các kiểm thử context-engine PI nên tiếp tục pass mà không thay đổi.

### Kiểm thử tích hợp / live

Thêm hoặc mở rộng kiểm thử smoke live cho harness Codex:

- cấu hình `plugins.slots.contextEngine` thành một engine kiểm thử
- cấu hình `agents.defaults.model` thành một model `codex/*`
- cấu hình `agents.defaults.embeddedHarness.runtime = "codex"`
- assert rằng engine kiểm thử đã quan sát:
  - bootstrap
  - assemble
  - afterTurn hoặc ingest
  - maintenance

Tránh yêu cầu lossless-claw trong kiểm thử core OpenClaw. Dùng một plugin
context engine giả nhỏ trong repo.

## Khả năng quan sát

Thêm log debug quanh các lời gọi vòng đời context-engine Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` kèm lý do
- `codex native compaction completed alongside context-engine compaction`

Tránh log toàn bộ prompt hoặc nội dung bản ghi hội thoại.

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

- Nếu không có context engine được cấu hình, hành vi context engine legacy nên
  tương đương với hành vi harness Codex hiện nay.
- Nếu `assemble` của context-engine thất bại, Codex nên tiếp tục với đường dẫn
  prompt gốc.
- Binding thread Codex hiện có nên vẫn hợp lệ.
- Fingerprinting công cụ động không nên bao gồm đầu ra context-engine; nếu không,
  mỗi thay đổi ngữ cảnh có thể buộc tạo thread Codex mới. Chỉ catalog công cụ
  nên ảnh hưởng đến fingerprint công cụ động.

## Câu hỏi mở

1. Ngữ cảnh đã assemble nên được chèn hoàn toàn vào user prompt, hoàn toàn
   vào developer instructions, hay chia tách?

   Khuyến nghị: chia tách. Đặt `systemPromptAddition` trong developer instructions;
   đặt ngữ cảnh bản ghi hội thoại đã assemble trong wrapper user prompt. Điều này khớp nhất
   với protocol Codex hiện tại mà không làm thay đổi lịch sử thread native.

2. Có nên tắt Compaction native Codex khi một context engine sở hữu
   Compaction không?

   Khuyến nghị: không, chưa nên. Compaction native Codex vẫn có thể
   cần thiết để giữ thread app-server hoạt động. Nhưng nó phải được báo cáo là
   Compaction Codex native, không phải là Compaction context-engine.

3. `before_prompt_build` nên chạy trước hay sau assembly của context-engine?

   Khuyến nghị: sau projection context-engine cho Codex, để các hook harness chung
   thấy prompt/developer instructions thực tế mà Codex sẽ nhận. Nếu tính tương đồng PI
   yêu cầu thứ tự ngược lại, hãy mã hóa thứ tự đã chọn trong kiểm thử và ghi tài liệu ở đây.

4. App-server Codex có thể chấp nhận override ngữ cảnh/lịch sử có cấu trúc trong tương lai không?

   Chưa biết. Nếu có thể, hãy thay lớp projection văn bản bằng protocol đó và
   giữ nguyên các lời gọi vòng đời.

## Tiêu chí chấp nhận

- Một lượt harness nhúng `codex/*` gọi vòng đời assemble của context engine đã chọn.
- `systemPromptAddition` của context-engine ảnh hưởng đến developer instructions của Codex.
- Ngữ cảnh đã assemble ảnh hưởng đến input lượt Codex một cách xác định.
- Các lượt Codex thành công gọi `afterTurn` hoặc ingest dự phòng.
- Các lượt Codex thành công chạy turn maintenance của context-engine.
- Các lượt thất bại/aborted/yield-aborted không chạy turn maintenance.
- Compaction do context-engine sở hữu vẫn là chính cho trạng thái OpenClaw/plugin.
- Compaction native Codex vẫn có thể được kiểm toán như hành vi Codex native.
- Hành vi context-engine PI hiện có không thay đổi.
- Hành vi harness Codex hiện có không thay đổi khi không có context engine không legacy
  được chọn hoặc khi assembly thất bại.
