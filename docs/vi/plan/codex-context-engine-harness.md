---
read_when:
    - Bạn đang tích hợp hành vi vòng đời của context-engine vào harness Codex
    - Bạn cần lossless-claw hoặc một Plugin context-engine khác để làm việc với các phiên bộ khung nhúng codex/*
    - Bạn đang so sánh hành vi ngữ cảnh của máy chủ ứng dụng OpenClaw và Codex nhúng
summary: Đặc tả để khiến harness app-server Codex được đóng gói tôn trọng các Plugin context-engine của OpenClaw
title: Cổng Công cụ Ngữ cảnh Codex Harness
x-i18n:
    generated_at: "2026-06-27T17:41:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Trạng thái

Đặc tả triển khai bản nháp.

## Mục tiêu

Làm cho bộ điều phối app-server Codex được đóng gói sẵn tôn trọng cùng hợp đồng
vòng đời công cụ ngữ cảnh OpenClaw mà các lượt OpenClaw nhúng đã tôn trọng.

Một phiên dùng nhà cung cấp/mô hình `agentRuntime.id: "codex"` hoặc mô hình
`codex/*` vẫn nên cho phép Plugin công cụ ngữ cảnh được chọn, chẳng hạn như
`lossless-claw`, kiểm soát việc lắp ráp ngữ cảnh, thu nạp sau lượt, bảo trì và
chính sách Compaction cấp OpenClaw trong phạm vi mà ranh giới app-server Codex
cho phép.

## Không phải mục tiêu

- Không triển khai lại nội bộ app-server Codex.
- Không khiến Compaction luồng gốc của Codex tạo ra bản tóm tắt lossless-claw.
- Không yêu cầu các mô hình không phải Codex dùng bộ điều phối Codex.
- Không thay đổi hành vi phiên ACP/acpx. Đặc tả này chỉ dành cho đường dẫn bộ
  điều phối tác tử nhúng không thuộc ACP.
- Không khiến Plugin bên thứ ba đăng ký các factory tiện ích mở rộng app-server
  Codex; ranh giới tin cậy Plugin đóng gói sẵn hiện có vẫn giữ nguyên.

## Kiến trúc hiện tại

Vòng lặp chạy nhúng phân giải công cụ ngữ cảnh đã cấu hình một lần cho mỗi lượt
chạy trước khi chọn một bộ điều phối cấp thấp cụ thể:

- `src/agents/embedded-agent-runner/run.ts`
  - khởi tạo các Plugin công cụ ngữ cảnh
  - gọi `resolveContextEngine(params.config)`
  - truyền `contextEngine` và `contextTokenBudget` vào
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` ủy quyền cho bộ điều phối tác tử được chọn:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Bộ điều phối app-server Codex được đăng ký bởi Plugin Codex đóng gói sẵn:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Triển khai bộ điều phối Codex nhận cùng `EmbeddedRunAttemptParams` như các lượt
thử OpenClaw tích hợp sẵn:

- `extensions/codex/src/app-server/run-attempt.ts`

Điều đó có nghĩa điểm móc cần thiết nằm trong mã do OpenClaw kiểm soát. Ranh
giới bên ngoài là chính giao thức app-server Codex: OpenClaw có thể kiểm soát
nội dung nó gửi tới `thread/start`, `thread/resume` và `turn/start`, và có thể
quan sát thông báo, nhưng không thể thay đổi kho luồng nội bộ hoặc bộ Compaction
gốc của Codex.

## Khoảng trống hiện tại

Các lượt thử OpenClaw tích hợp sẵn gọi trực tiếp vòng đời công cụ ngữ cảnh:

- khởi động/bảo trì trước lượt thử
- lắp ráp trước lời gọi mô hình
- afterTurn hoặc thu nạp sau lượt thử
- bảo trì sau một lượt thành công
- Compaction công cụ ngữ cảnh cho các công cụ sở hữu Compaction

Mã OpenClaw liên quan:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Các lượt thử app-server Codex hiện chạy các móc bộ điều phối tác tử chung và
phản chiếu bản ghi hội thoại, nhưng không gọi `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` hoặc
`params.contextEngine.maintain`.

Mã Codex liên quan:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Hành vi mong muốn

Đối với các lượt của bộ điều phối Codex, OpenClaw nên duy trì vòng đời này:

1. Đọc bản ghi hội thoại phiên OpenClaw đã phản chiếu.
2. Khởi động công cụ ngữ cảnh đang hoạt động khi có tệp phiên trước đó.
3. Chạy bảo trì khởi động khi có.
4. Lắp ráp ngữ cảnh bằng công cụ ngữ cảnh đang hoạt động.
5. Chuyển đổi ngữ cảnh đã lắp ráp thành đầu vào tương thích với Codex.
6. Bắt đầu hoặc tiếp tục luồng Codex với hướng dẫn dành cho nhà phát triển có
   bao gồm mọi `systemPromptAddition` của công cụ ngữ cảnh.
7. Bắt đầu lượt Codex với lời nhắc hướng tới người dùng đã lắp ráp.
8. Phản chiếu kết quả Codex trở lại bản ghi hội thoại OpenClaw.
9. Gọi `afterTurn` nếu được triển khai, nếu không thì `ingestBatch`/`ingest`,
   bằng ảnh chụp bản ghi hội thoại đã phản chiếu.
10. Chạy bảo trì lượt sau các lượt thành công không bị hủy.
11. Duy trì tín hiệu Compaction gốc của Codex và các móc Compaction của OpenClaw.

## Ràng buộc thiết kế

### App-server Codex vẫn là nguồn chuẩn cho trạng thái luồng gốc

Codex sở hữu luồng gốc của nó và mọi lịch sử mở rộng nội bộ. OpenClaw không nên
cố gắng sửa đổi lịch sử nội bộ của app-server ngoài các lời gọi giao thức được
hỗ trợ.

Bản phản chiếu bản ghi hội thoại của OpenClaw vẫn là nguồn cho các tính năng
OpenClaw:

- lịch sử trò chuyện
- tìm kiếm
- sổ sách cho `/new` và `/reset`
- chuyển đổi mô hình hoặc bộ điều phối trong tương lai
- trạng thái Plugin công cụ ngữ cảnh

### Việc lắp ráp công cụ ngữ cảnh phải được chiếu vào đầu vào Codex

Giao diện công cụ ngữ cảnh trả về `AgentMessage[]` của OpenClaw, không phải một
bản vá luồng Codex. `turn/start` của app-server Codex nhận đầu vào người dùng
hiện tại, trong khi `thread/start` và `thread/resume` nhận hướng dẫn dành cho
nhà phát triển.

Vì vậy, triển khai cần một lớp chiếu. Phiên bản đầu tiên an toàn nên tránh giả
vờ rằng nó có thể thay thế lịch sử nội bộ Codex. Nó nên chèn ngữ cảnh đã lắp ráp
dưới dạng nội dung lời nhắc/hướng dẫn dành cho nhà phát triển có tính xác định
xung quanh lượt hiện tại.

### Độ ổn định bộ nhớ đệm lời nhắc rất quan trọng

Đối với các công cụ như lossless-claw, ngữ cảnh đã lắp ráp nên có tính xác định
khi đầu vào không đổi. Không thêm dấu thời gian, id ngẫu nhiên hoặc thứ tự không
xác định vào văn bản ngữ cảnh được tạo.

### Ngữ nghĩa chọn runtime không thay đổi

Việc chọn bộ điều phối giữ nguyên như hiện tại:

- `runtime: "openclaw"` chọn bộ điều phối OpenClaw tích hợp sẵn
- `runtime: "codex"` chọn bộ điều phối Codex đã đăng ký
- `runtime: "auto"` cho phép các bộ điều phối Plugin nhận các nhà cung cấp được hỗ trợ
- các lượt chạy `auto` không khớp dùng bộ điều phối OpenClaw tích hợp sẵn

Công việc này thay đổi điều xảy ra sau khi bộ điều phối Codex được chọn.

## Kế hoạch triển khai

### 1. Xuất hoặc di chuyển các helper lượt thử công cụ ngữ cảnh có thể tái sử dụng

Hiện nay các helper vòng đời có thể tái sử dụng nằm dưới trình chạy tác tử nhúng:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex nên nhập các helper trung lập với bộ điều phối thay vì chạm vào chi tiết
triển khai của trình chạy.

Tạo một mô-đun trung lập với bộ điều phối, ví dụ:

- `src/agents/harness/context-engine-lifecycle.ts`

Di chuyển hoặc xuất lại:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- một wrapper nhỏ quanh `runContextEngineMaintenance`

Cập nhật các điểm gọi của bộ điều phối tích hợp sẵn trong cùng PR.

Tên helper trung lập không nên nhắc đến bộ điều phối tích hợp sẵn.

Tên gợi ý:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Thêm helper chiếu ngữ cảnh Codex

Thêm một mô-đun mới:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Trách nhiệm:

- Nhận `AgentMessage[]` đã lắp ráp, lịch sử phản chiếu gốc và lời nhắc hiện tại.
- Xác định ngữ cảnh nào thuộc về hướng dẫn dành cho nhà phát triển so với đầu
  vào người dùng hiện tại.
- Giữ lời nhắc người dùng hiện tại làm yêu cầu có thể hành động cuối cùng.
- Kết xuất các tin nhắn trước đó theo định dạng ổn định, rõ ràng.
- Tránh siêu dữ liệu biến động.

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

- Đặt `systemPromptAddition` vào hướng dẫn dành cho nhà phát triển.
- Đặt ngữ cảnh bản ghi hội thoại đã lắp ráp trước lời nhắc hiện tại trong `promptText`.
- Gắn nhãn rõ đó là ngữ cảnh đã lắp ráp của OpenClaw.
- Giữ lời nhắc hiện tại ở cuối.
- Loại trừ lời nhắc người dùng hiện tại bị trùng nếu nó đã xuất hiện ở phần đuôi.

Ví dụ hình dạng lời nhắc:

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

Cách này kém thanh lịch hơn so với phẫu thuật lịch sử Codex gốc, nhưng có thể
triển khai bên trong OpenClaw và vẫn duy trì ngữ nghĩa công cụ ngữ cảnh.

Cải tiến trong tương lai: nếu app-server Codex phơi bày một giao thức để thay
thế hoặc bổ sung lịch sử luồng, hãy đổi lớp chiếu này sang dùng API đó.

### 3. Nối khởi động trước khi khởi động luồng Codex

Trong `extensions/codex/src/app-server/run-attempt.ts`:

- Đọc lịch sử phiên phản chiếu như hiện nay.
- Xác định liệu tệp phiên đã tồn tại trước lượt chạy này hay chưa. Ưu tiên một
  helper kiểm tra `fs.stat(params.sessionFile)` trước các lần ghi phản chiếu.
- Mở `SessionManager` hoặc dùng adapter trình quản lý phiên hẹp nếu helper yêu cầu.
- Gọi helper khởi động trung lập khi `params.contextEngine` tồn tại.

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

Dùng cùng quy ước `sessionKey` như cầu nối công cụ Codex và bản phản chiếu bản
ghi hội thoại. Hiện nay Codex tính `sandboxSessionKey` từ `params.sessionKey`
hoặc `params.sessionId`; dùng nhất quán giá trị đó trừ khi có lý do để giữ
`params.sessionKey` thô.

### 4. Nối lắp ráp trước `thread/start` / `thread/resume` và `turn/start`

Trong `runCodexAppServerAttempt`:

1. Trước tiên xây dựng công cụ động, để công cụ ngữ cảnh thấy tên công cụ thực
   sự có sẵn.
2. Đọc lịch sử phiên phản chiếu.
3. Chạy `assemble(...)` của công cụ ngữ cảnh khi `params.contextEngine` tồn tại.
4. Chiếu kết quả đã lắp ráp vào:
   - phần bổ sung hướng dẫn dành cho nhà phát triển
   - văn bản lời nhắc cho `turn/start`

Lời gọi móc hiện có:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

nên trở nên nhận biết ngữ cảnh:

1. tính hướng dẫn dành cho nhà phát triển cơ sở bằng `buildDeveloperInstructions(params)`
2. áp dụng lắp ráp/chiếu công cụ ngữ cảnh
3. chạy `before_prompt_build` với lời nhắc/hướng dẫn dành cho nhà phát triển đã chiếu

Thứ tự này cho phép các móc lời nhắc chung thấy cùng lời nhắc mà Codex sẽ nhận.
Nếu cần tương đương nghiêm ngặt với OpenClaw, hãy chạy lắp ráp công cụ ngữ cảnh
trước thành phần móc, vì bộ điều phối tích hợp sẵn áp dụng
`systemPromptAddition` của công cụ ngữ cảnh vào lời nhắc hệ thống cuối cùng sau
đường ống lời nhắc của nó. Bất biến quan trọng là cả công cụ ngữ cảnh và các
móc đều có thứ tự xác định, được lập tài liệu.

Thứ tự khuyến nghị cho triển khai đầu tiên:

1. `buildDeveloperInstructions(params)`
2. `assemble()` của công cụ ngữ cảnh
3. thêm `systemPromptAddition` vào đầu/cuối hướng dẫn dành cho nhà phát triển
4. chiếu các tin nhắn đã lắp ráp vào văn bản lời nhắc
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. truyền hướng dẫn dành cho nhà phát triển cuối cùng tới `startOrResumeThread(...)`
7. truyền văn bản lời nhắc cuối cùng tới `buildTurnStartParams(...)`

Đặc tả này nên được mã hóa trong kiểm thử để các thay đổi trong tương lai không
vô tình sắp xếp lại thứ tự.

### 5. Duy trì định dạng ổn định cho bộ nhớ đệm lời nhắc

Helper chiếu phải tạo đầu ra ổn định theo byte cho các đầu vào giống hệt nhau:

- thứ tự tin nhắn ổn định
- nhãn vai trò ổn định
- không có dấu thời gian được tạo
- không rò rỉ thứ tự khóa đối tượng
- không có dấu phân cách ngẫu nhiên
- không có id theo từng lượt chạy

Dùng dấu phân cách cố định và các phần rõ ràng.

### 6. Nối hậu lượt sau khi phản chiếu bản ghi hội thoại

`CodexAppServerEventProjector` của Codex xây dựng một `messagesSnapshot` cục bộ cho
lượt hiện tại. `mirrorTranscriptBestEffort(...)` ghi ảnh chụp đó vào bản sao bản ghi
OpenClaw.

Sau khi sao chép thành công hoặc thất bại, hãy gọi bộ hoàn tất của công cụ ngữ cảnh với
ảnh chụp thông điệp tốt nhất hiện có:

- Ưu tiên ngữ cảnh phiên đã sao chép đầy đủ sau khi ghi, vì `afterTurn`
  mong đợi ảnh chụp phiên, không chỉ lượt hiện tại.
- Dùng dự phòng `historyMessages + result.messagesSnapshot` nếu không thể mở lại
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

Nếu sao chép thất bại, vẫn gọi `afterTurn` với ảnh chụp dự phòng, nhưng ghi log
rằng công cụ ngữ cảnh đang nạp từ dữ liệu lượt dự phòng.

### 7. Chuẩn hóa ngữ cảnh thời gian chạy về mức sử dụng và bộ nhớ đệm prompt

Kết quả Codex bao gồm mức sử dụng đã chuẩn hóa từ thông báo token của app-server khi
có sẵn. Truyền mức sử dụng đó vào ngữ cảnh thời gian chạy của công cụ ngữ cảnh.

Nếu app-server Codex sau này cung cấp chi tiết đọc/ghi bộ nhớ đệm, hãy ánh xạ chúng vào
`ContextEnginePromptCacheInfo`. Cho đến lúc đó, hãy bỏ qua `promptCache` thay vì
tự tạo các giá trị 0.

### 8. Chính sách Compaction

Có hai hệ thống Compaction:

1. `compact()` của công cụ ngữ cảnh OpenClaw
2. `thread/compact/start` gốc của app-server Codex

Không âm thầm gộp chúng lại với nhau.

#### `/compact` và OpenClaw Compaction tường minh

Khi công cụ ngữ cảnh được chọn có `info.ownsCompaction === true`, OpenClaw Compaction
tường minh nên ưu tiên kết quả `compact()` của công cụ ngữ cảnh cho bản sao bản ghi
OpenClaw và trạng thái Plugin.

Khi harness Codex được chọn có liên kết thread gốc, chúng ta có thể yêu cầu thêm
Codex Compaction gốc để giữ cho thread app-server khỏe mạnh, nhưng việc này phải
được báo cáo như một hành động backend riêng trong chi tiết.

Hành vi khuyến nghị:

- Nếu `contextEngine.info.ownsCompaction === true`:
  - gọi `compact()` của công cụ ngữ cảnh trước
  - sau đó gọi Codex Compaction gốc theo kiểu nỗ lực tối đa khi có liên kết thread
  - trả về kết quả của công cụ ngữ cảnh làm kết quả chính
  - bao gồm trạng thái Codex Compaction gốc trong `details.codexNativeCompaction`
- Nếu công cụ ngữ cảnh đang hoạt động không sở hữu Compaction:
  - giữ nguyên hành vi Codex Compaction gốc hiện tại

Việc này có thể cần thay đổi `extensions/codex/src/app-server/compact.ts` hoặc
bọc nó từ đường dẫn Compaction chung, tùy vào nơi
`maybeCompactAgentHarnessSession(...)` được gọi.

#### Sự kiện contextCompaction gốc của Codex trong lượt

Codex có thể phát ra sự kiện mục `contextCompaction` trong một lượt. Giữ nguyên
việc phát hook Compaction trước/sau hiện tại trong `event-projector.ts`, nhưng không
xem đó là một Compaction công cụ ngữ cảnh đã hoàn tất.

Đối với các công cụ sở hữu Compaction, hãy phát chẩn đoán tường minh khi Codex vẫn
thực hiện Compaction gốc:

- tên luồng/sự kiện: luồng `compaction` hiện có là chấp nhận được
- chi tiết: `{ backend: "codex-app-server", ownsCompaction: true }`

Điều này giúp việc tách biệt có thể kiểm toán được.

### 9. Hành vi đặt lại phiên và liên kết

`reset(...)` hiện có của harness Codex xóa liên kết app-server Codex khỏi
tệp phiên OpenClaw. Giữ nguyên hành vi đó.

Đồng thời đảm bảo việc dọn dẹp trạng thái công cụ ngữ cảnh tiếp tục diễn ra thông qua
các đường dẫn vòng đời phiên OpenClaw hiện có. Không thêm dọn dẹp riêng cho Codex trừ khi
vòng đời công cụ ngữ cảnh hiện đang bỏ sót các sự kiện đặt lại/xóa cho mọi harness.

### 10. Xử lý lỗi

Tuân theo ngữ nghĩa tích hợp sẵn của OpenClaw:

- lỗi bootstrap cảnh báo và tiếp tục
- lỗi assemble cảnh báo và quay về thông điệp/prompt pipeline chưa assemble
- lỗi afterTurn/ingest cảnh báo và đánh dấu hoàn tất sau lượt là không thành công
- bảo trì chỉ chạy sau các lượt thành công, không bị hủy và không yield
- lỗi Compaction không nên được thử lại như các prompt mới

Các bổ sung riêng cho Codex:

- Nếu chiếu ngữ cảnh thất bại, cảnh báo và quay về prompt gốc.
- Nếu sao chép bản ghi thất bại, vẫn cố gắng hoàn tất công cụ ngữ cảnh với
  thông điệp dự phòng.
- Nếu Codex Compaction gốc thất bại sau khi Compaction công cụ ngữ cảnh thành công,
  không làm thất bại toàn bộ OpenClaw Compaction khi công cụ ngữ cảnh là chính.

## Kế hoạch kiểm thử

### Kiểm thử đơn vị

Thêm kiểm thử trong `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex gọi `bootstrap` khi có tệp phiên tồn tại.
   - Codex gọi `assemble` với các thông điệp được phản chiếu, ngân sách token, tên công cụ,
     chế độ trích dẫn, id mô hình và prompt.
   - `systemPromptAddition` được đưa vào chỉ dẫn dành cho nhà phát triển.
   - Các thông điệp đã lắp ráp được chiếu vào prompt trước yêu cầu hiện tại.
   - Codex gọi `afterTurn` sau khi phản chiếu bản ghi hội thoại.
   - Khi không có `afterTurn`, Codex gọi `ingestBatch` hoặc `ingest` theo từng thông điệp.
   - Bảo trì lượt chạy sau các lượt thành công.
   - Bảo trì lượt không chạy khi có lỗi prompt, hủy bỏ, hoặc yield abort.

2. `context-engine-projection.test.ts`
   - đầu ra ổn định cho các đầu vào giống hệt nhau
   - không trùng lặp prompt hiện tại khi lịch sử đã lắp ráp đã bao gồm nó
   - xử lý lịch sử trống
   - giữ nguyên thứ tự vai trò
   - chỉ đưa phần bổ sung prompt hệ thống vào chỉ dẫn dành cho nhà phát triển

3. `compact.context-engine.test.ts`
   - kết quả chính của bộ máy ngữ cảnh sở hữu được ưu tiên
   - trạng thái Compaction gốc của Codex xuất hiện trong chi tiết khi cũng được thử
   - lỗi gốc của Codex không làm thất bại Compaction do bộ máy ngữ cảnh sở hữu
   - bộ máy ngữ cảnh không sở hữu giữ nguyên hành vi Compaction gốc hiện tại

### Kiểm thử hiện có cần cập nhật

- `extensions/codex/src/app-server/run-attempt.test.ts` nếu có, nếu không thì
  các kiểm thử chạy Codex app-server gần nhất.
- `extensions/codex/src/app-server/event-projector.test.ts` chỉ khi chi tiết sự kiện
  Compaction thay đổi.
- `src/agents/harness/selection.test.ts` không cần thay đổi trừ khi hành vi cấu hình
  thay đổi; nó nên tiếp tục ổn định.
- Các kiểm thử bộ máy ngữ cảnh của harness tích hợp sẵn nên tiếp tục chạy qua mà không đổi.

### Kiểm thử tích hợp / trực tiếp

Thêm hoặc mở rộng các kiểm thử smoke trực tiếp cho Codex harness:

- cấu hình `plugins.slots.contextEngine` thành một bộ máy kiểm thử
- cấu hình `agents.defaults.model` thành một mô hình `codex/*`
- cấu hình provider/model `agentRuntime.id = "codex"`
- xác nhận bộ máy kiểm thử đã quan sát:
  - bootstrap
  - assemble
  - afterTurn hoặc ingest
  - maintenance

Tránh yêu cầu lossless-claw trong kiểm thử lõi OpenClaw. Dùng một Plugin bộ máy
ngữ cảnh giả nhỏ trong repo.

## Khả năng quan sát

Thêm nhật ký gỡ lỗi quanh các lệnh gọi vòng đời bộ máy ngữ cảnh của Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` kèm lý do
- `codex native compaction completed alongside context-engine compaction`

Tránh ghi nhật ký toàn bộ prompt hoặc nội dung bản ghi hội thoại.

Thêm các trường có cấu trúc khi hữu ích:

- `sessionId`
- `sessionKey` được che hoặc bỏ qua theo thực hành ghi nhật ký hiện có
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Di trú / tương thích

Điều này nên tương thích ngược:

- Nếu không cấu hình bộ máy ngữ cảnh, hành vi bộ máy ngữ cảnh legacy nên
  tương đương với hành vi Codex harness hiện nay.
- Nếu `assemble` của bộ máy ngữ cảnh thất bại, Codex nên tiếp tục với đường dẫn
  prompt ban đầu.
- Các liên kết luồng Codex hiện có nên vẫn hợp lệ.
- Dấu vân tay công cụ động không nên bao gồm đầu ra của bộ máy ngữ cảnh; nếu không,
  mọi thay đổi ngữ cảnh đều có thể buộc tạo một luồng Codex mới. Chỉ danh mục công cụ
  nên ảnh hưởng đến dấu vân tay công cụ động.

## Câu hỏi mở

1. Ngữ cảnh đã lắp ráp nên được chèn hoàn toàn vào prompt người dùng, hoàn toàn
   vào chỉ dẫn dành cho nhà phát triển, hay tách ra?

   Khuyến nghị: tách ra. Đặt `systemPromptAddition` trong chỉ dẫn dành cho nhà phát triển;
   đặt ngữ cảnh bản ghi hội thoại đã lắp ráp trong wrapper prompt người dùng. Cách này khớp
   nhất với giao thức Codex hiện tại mà không biến đổi lịch sử luồng gốc.

2. Có nên tắt Compaction gốc của Codex khi một bộ máy ngữ cảnh sở hữu
   Compaction không?

   Khuyến nghị: không, chưa nên ở giai đoạn đầu. Compaction gốc của Codex vẫn có thể
   cần thiết để giữ luồng app-server hoạt động. Nhưng nó phải được báo cáo là
   Compaction gốc của Codex, không phải là Compaction của bộ máy ngữ cảnh.

3. `before_prompt_build` nên chạy trước hay sau khi bộ máy ngữ cảnh lắp ráp?

   Khuyến nghị: sau phép chiếu bộ máy ngữ cảnh cho Codex, để các hook harness chung
   thấy prompt/chỉ dẫn dành cho nhà phát triển thực tế mà Codex sẽ nhận. Nếu tính tương đương
   với harness tích hợp sẵn yêu cầu thứ tự ngược lại, hãy mã hóa thứ tự đã chọn trong
   kiểm thử và ghi lại tại đây.

4. Codex app-server có thể chấp nhận một ghi đè ngữ cảnh/lịch sử có cấu trúc trong tương lai không?

   Chưa rõ. Nếu có thể, hãy thay lớp chiếu văn bản bằng giao thức đó và
   giữ nguyên các lệnh gọi vòng đời.

## Tiêu chí chấp nhận

- Một lượt harness nhúng `codex/*` gọi vòng đời assemble của bộ máy ngữ cảnh
  đã chọn.
- `systemPromptAddition` của bộ máy ngữ cảnh ảnh hưởng đến chỉ dẫn dành cho nhà phát triển của Codex.
- Ngữ cảnh đã lắp ráp ảnh hưởng đến đầu vào lượt Codex theo cách tất định.
- Các lượt Codex thành công gọi `afterTurn` hoặc phương án dự phòng ingest.
- Các lượt Codex thành công chạy bảo trì lượt của bộ máy ngữ cảnh.
- Các lượt thất bại/bị hủy/yield-aborted không chạy bảo trì lượt.
- Compaction do bộ máy ngữ cảnh sở hữu vẫn là chính cho trạng thái OpenClaw/Plugin.
- Compaction gốc của Codex vẫn có thể kiểm tra được như hành vi gốc của Codex.
- Hành vi bộ máy ngữ cảnh của harness tích hợp sẵn hiện có không thay đổi.
- Hành vi Codex harness hiện có không thay đổi khi không có bộ máy ngữ cảnh
  không phải legacy nào được chọn hoặc khi lắp ráp thất bại.
