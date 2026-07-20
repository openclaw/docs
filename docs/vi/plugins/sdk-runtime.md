---
read_when:
    - Bạn cần gọi các hàm trợ giúp cốt lõi từ một plugin (TTS, STT, tạo ảnh, tìm kiếm web, Gateway, tác tử phụ, các node)
    - Bạn muốn hiểu `api.runtime` cung cấp những gì
    - Bạn đang truy cập các trình trợ giúp cấu hình, agent hoặc phương tiện từ mã Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- các trình trợ giúp runtime được chèn, dành cho các plugin
title: Các trình trợ giúp runtime của Plugin
x-i18n:
    generated_at: "2026-07-20T04:29:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 197ccf047ccefddbd515ace9f1ce195e998f3fbafcb65ee80282bf67f0c6ab8d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Tham chiếu cho đối tượng `api.runtime` được chèn vào mọi plugin trong quá trình đăng ký. Sử dụng các trình trợ giúp này thay vì nhập trực tiếp các thành phần nội bộ của máy chủ.

<CardGroup cols={2}>
  <Card title="Plugin kênh" href="/vi/plugins/sdk-channel-plugins">
    Hướng dẫn từng bước sử dụng các trình trợ giúp này trong ngữ cảnh của plugin kênh.
  </Card>
  <Card title="Plugin nhà cung cấp" href="/vi/plugins/sdk-provider-plugins">
    Hướng dẫn từng bước sử dụng các trình trợ giúp này trong ngữ cảnh của plugin nhà cung cấp.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` là phiên bản sản phẩm OpenClaw hiện tại, được lấy từ trình phân giải phiên bản dùng chung để các plugin thấy cùng giá trị mà CLI báo cáo.

## Tải và ghi cấu hình

Ưu tiên cấu hình đã được truyền vào đường dẫn lệnh gọi đang hoạt động, ví dụ `api.config` trong quá trình đăng ký hoặc đối số `cfg` trên các callback của kênh/nhà cung cấp. Cách này duy trì một ảnh chụp nhanh tiến trình xuyên suốt công việc thay vì phân tích lại cấu hình trên các đường dẫn nóng.

Chỉ sử dụng `api.runtime.config.current()` khi một trình xử lý tồn tại lâu cần ảnh chụp nhanh tiến trình hiện tại và không có cấu hình nào được truyền vào hàm đó. Giá trị trả về là chỉ đọc; hãy sao chép hoặc sử dụng trình trợ giúp đột biến trước khi chỉnh sửa.

Các factory công cụ nhận `ctx.runtimeConfig` cùng với `ctx.getRuntimeConfig()`. Sử dụng getter bên trong callback `execute` của một công cụ tồn tại lâu khi cấu hình có thể thay đổi sau khi định nghĩa công cụ được tạo.

Lưu các thay đổi bằng `api.runtime.config.mutateConfigFile(...)` hoặc `api.runtime.config.replaceConfigFile(...)`. Mỗi lần ghi phải chọn một chính sách `afterWrite` rõ ràng:

- `afterWrite: { mode: "auto" }` cho phép trình lập kế hoạch tải lại của Gateway quyết định.
- `afterWrite: { mode: "restart", reason: "..." }` buộc khởi động lại sạch khi thành phần ghi biết rằng tải lại nóng không an toàn.
- `afterWrite: { mode: "none", reason: "..." }` chỉ ngăn việc tự động tải lại/khởi động lại khi bên gọi sở hữu bước tiếp theo.

Các trình trợ giúp đột biến trả về `afterWrite` cùng với bản tóm tắt `followUp` có kiểu để bên gọi có thể ghi nhật ký hoặc kiểm thử xem họ có yêu cầu khởi động lại hay không. Gateway vẫn quyết định thời điểm việc khởi động lại đó thực sự diễn ra.

Sử dụng `current()`, `cfg` được truyền vào, `mutateConfigFile(...)`, hoặc
`replaceConfigFile(...)` để truy cập và ghi cấu hình thời gian chạy.

Đối với các lệnh nhập SDK trực tiếp, ưu tiên các đường dẫn con cấu hình chuyên biệt hơn barrel tương thích `openclaw/plugin-sdk/config-runtime` tổng quát: `config-contracts` cho các kiểu, `runtime-config-snapshot` cho ảnh chụp nhanh tiến trình hiện tại và `config-mutation` cho các thao tác ghi. Đọc các giá trị có phạm vi mục nhập từ `api.pluginConfig`; chỉ sử dụng ngữ cảnh công cụ được cung cấp cho ảnh chụp nhanh cấu hình trên toàn thời gian chạy của nó và giữ việc hợp nhất dành riêng cho plugin tại ranh giới đó. Các bài kiểm thử plugin đi kèm nên mô phỏng trực tiếp các đường dẫn con chuyên biệt này thay vì mô phỏng barrel tương thích tổng quát.

Mã thời gian chạy nội bộ của OpenClaw tuân theo cùng một định hướng: tải cấu hình một lần tại ranh giới CLI, Gateway hoặc tiến trình, sau đó truyền giá trị đó xuyên suốt. Các lần ghi đột biến thành công làm mới ảnh chụp nhanh thời gian chạy của tiến trình và tăng bản sửa đổi nội bộ; các bộ nhớ đệm tồn tại lâu nên sử dụng khóa bộ nhớ đệm do thời gian chạy sở hữu thay vì tuần tự hóa cấu hình cục bộ. Các mô-đun thời gian chạy tồn tại lâu có trình quét không khoan nhượng đối với các lệnh gọi `loadConfig()` ngầm định; hãy sử dụng `cfg` được truyền vào, `context.getRuntimeConfig()` của yêu cầu hoặc `getRuntimeConfig()` tại một ranh giới tiến trình rõ ràng.

Các đường dẫn thực thi của nhà cung cấp và kênh phải sử dụng ảnh chụp nhanh cấu hình thời gian chạy đang hoạt động, không phải ảnh chụp nhanh tệp được trả về để đọc lại hoặc chỉnh sửa cấu hình. Ảnh chụp nhanh tệp giữ nguyên các giá trị nguồn như dấu SecretRef cho giao diện người dùng và thao tác ghi; callback của nhà cung cấp cần chế độ xem thời gian chạy đã được phân giải. Khi một trình trợ giúp có thể được gọi với ảnh chụp nhanh nguồn đang hoạt động hoặc ảnh chụp nhanh thời gian chạy đang hoạt động, hãy định tuyến qua `selectApplicableRuntimeConfig()` trước khi đọc thông tin xác thực.

## Tiện ích thời gian chạy có thể tái sử dụng

Sử dụng các dữ kiện `botLoopProtection` đầu vào cho thông báo đầu vào do bot tạo. Phần lõi áp dụng biện pháp bảo vệ cửa sổ trượt trong bộ nhớ dùng chung trước khi ghi phiên và điều phối mà không ràng buộc chính sách với một kênh. Biện pháp bảo vệ theo dõi các khóa `(scopeId, conversationId, participant pair)`, đếm chung cả hai hướng của một cặp, áp dụng thời gian chờ sau khi vượt quá hạn mức cửa sổ và chủ động loại bỏ các mục không hoạt động khi có cơ hội.

Các plugin kênh cung cấp hành vi này cho người vận hành nên ưu tiên hình dạng `channels.defaults.botLoopProtection` dùng chung cho các hạn mức cơ sở, sau đó xếp chồng các ghi đè dành riêng cho kênh/nhà cung cấp lên trên. Cấu hình dùng chung sử dụng giây vì đây là cấu hình hướng đến người dùng:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Truyền các dữ kiện cặp bot đã chuẩn hóa cùng lượt đã phân giải. Phần lõi phân giải giá trị mặc định, chuyển đổi đơn vị và ngữ nghĩa `enabled`:

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

Chỉ sử dụng trực tiếp `openclaw/plugin-sdk/pair-loop-guard-runtime` cho các vòng lặp sự kiện hai bên tùy chỉnh
không đi qua trình chạy phản hồi đầu vào dùng chung.

## Không gian tên thời gian chạy

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Danh tính tác nhân, thư mục và quản lý phiên.

    ```typescript
    // Phân giải thư mục làm việc của tác nhân (bắt buộc có agentId)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Phân giải không gian làm việc của tác nhân
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // Lấy danh tính tác nhân
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Lấy mức suy luận mặc định
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Xác thực mức suy luận do người dùng cung cấp dựa trên hồ sơ nhà cung cấp đang hoạt động
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // truyền mức này vào một lượt chạy nhúng
    }

    // Lấy thời gian chờ của tác nhân
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Đảm bảo không gian làm việc tồn tại
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Chạy một lượt tác nhân nhúng
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Tóm tắt các thay đổi mới nhất",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` là trình trợ giúp trung lập để bắt đầu một lượt tác nhân OpenClaw thông thường từ mã plugin. Nó sử dụng cùng cách phân giải nhà cung cấp/mô hình và lựa chọn harness tác nhân như các phản hồi được kích hoạt bởi kênh.

    `runEmbeddedPiAgent(...)` vẫn được duy trì dưới dạng bí danh tương thích đã lỗi thời cho các plugin hiện có. Mã mới nên sử dụng `runEmbeddedAgent(...)`.

    `resolveCliBackendDispatchEligibility({ provider, model, agentId, authProfileId, config, agentDir, workspaceDir })` chia sẻ quyết định điều phối backend CLI của trình chạy nhúng (tuyến, khả năng `subscriptionAuthDispatch` được backend khai báo, chế độ thông tin xác thực đã lưu — tôn trọng `authProfileId` được ghim rõ ràng) với các bên gọi chọn đưa lượt chạy nhúng vào `cliBackendDispatch: "subscription-auth"`. Nó trả về `{ provider }` khi lượt chạy sẽ thực thi qua backend CLI và `undefined` khi lượt chạy vẫn dùng đường truyền trực tiếp, để bên gọi có thể phân bổ thời gian chờ cho lượt chạy thực sự được thực thi.

    `resolveThinkingPolicy(...)` trả về các mức suy luận được nhà cung cấp/mô hình hỗ trợ và giá trị mặc định tùy chọn. Các plugin nhà cung cấp sở hữu hồ sơ dành riêng cho mô hình thông qua các hook suy luận của chúng, vì vậy plugin công cụ nên gọi trình trợ giúp thời gian chạy này thay vì nhập hoặc sao chép danh sách nhà cung cấp.

    `normalizeThinkingLevel(...)` chuyển đổi văn bản người dùng như `on`, `x-high` hoặc `extra high` thành mức lưu trữ chuẩn trước khi kiểm tra mức đó dựa trên chính sách đã phân giải.

    **Các trình trợ giúp kho phiên** nằm trong `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Lặp qua các hàng phiên mà không phụ thuộc vào hình dạng sessions.json cũ.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Tạo hoặc cập nhật phiên, sau đó truyền signal vào lượt chạy tác nhân đã được tiếp nhận.
      },
    );
    ```

    Ưu tiên `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` hoặc `upsertSessionEntry(...)` cho quy trình làm việc với phiên. Các trình trợ giúp này định địa chỉ phiên theo danh tính tác nhân/phiên để plugin không phụ thuộc vào hình dạng lưu trữ `sessions.json` cũ. Sử dụng `preserveActivity: true` cho các bản vá chỉ liên quan đến siêu dữ liệu không nên làm mới hoạt động phiên và chỉ sử dụng `replaceEntry: true` khi callback trả về một mục hoàn chỉnh và các trường đã xóa phải tiếp tục bị xóa. Các đường dẫn Doctor và di chuyển có thể kết hợp `fallbackEntry`, `skipMaintenance` và `requireWriteSuccess` để sửa chữa kho chuẩn trong một thao tác nguyên tử.

    `createSessionEntry(...)` tạo một hàng phiên chuẩn và bản ghi hội thoại mới. Bề mặt `initialEntry` đáng tin cậy của nó được cố ý giới hạn: một `agentHarnessId` không rỗng, `modelSelectionLocked: true` tùy chọn và `pluginExtensions` tùy chọn. Thời gian chạy được chèn chỉ chấp nhận các ID harness thuộc sở hữu của plugin gọi thông qua `registerAgentHarness(...)`; đây là bất biến về quyền sở hữu, không phải sandbox giữa các plugin trong cùng tiến trình. Nó từ chối một hàng đã tồn tại; `label` và `spawnedCwd` là các trường tạo riêng biệt thay vì các bản vá mục đáng tin cậy.

    Quá trình tạo giữ hàng rào đột biến vòng đời phiên thông qua `afterCreate`, vì vậy công việc mới sẽ chờ quá trình khởi tạo do plugin sở hữu hoàn tất và công việc đã được tiếp nhận từ trước khiến việc tạo thất bại. Callback nhận một bản sao của trạng thái đã tạo. Nếu trả về một bản vá, bản vá đó chỉ có thể chứa `pluginExtensions`, và giá trị của nó là trường `pluginExtensions` cuối cùng hoàn chỉnh. Lỗi callback hoặc lỗi lưu cuối cùng sẽ hoàn tác hàng mới không thay đổi và bản ghi hội thoại; thao tác hoàn tác có bảo vệ giữ nguyên hàng đã bị thay đổi hoặc được nhận quyền đồng thời. `recoverMatchingInitialEntry: true` chỉ dùng để thử lại quá trình khởi tạo bị gián đoạn khi các trường đáng tin cậy đã lưu khớp chính xác, và quá trình khôi phục yêu cầu `afterCreate` trả về một bản vá cuối cùng.

    Sử dụng `runWithWorkAdmission(...)` khi một plugin bắt đầu công việc trên phiên đã được lưu. Callback từ chối các phiên đã lưu trữ hoặc bị thay thế đồng thời, duy trì phối hợp các đột biến lưu trữ/đặt lại/xóa cho đến khi hoàn tất và nhận một `AbortSignal` phải được chuyển tiếp đến lượt chạy tác nhân. Một harness có thể chỉ định rõ ràng các bên được ủy quyền thực thi đáng tin cậy thông qua trường đăng ký thử nghiệm `delegatedExecutionPluginIds` của nó. Các bên được ủy quyền chỉ có thể tiếp nhận và chạy đúng một phiên hiện có đã khóa mô hình; mọi đột biến phiên vẫn bị giới hạn cho chủ sở hữu harness. Xem [Plugin harness tác nhân](/vi/plugins/sdk-agent-harness#delegated-execution).

    Các plugin bảo trì và sửa chữa có thể sử dụng `deleteSessionEntry(...)` cho một mục phiên có phạm vi, `cleanupSessionLifecycleArtifacts(...)` cho các phiên tạm do vòng đời sở hữu và `resolveSessionStoreBackupPaths(...)` trước khi thay đổi một kho lưu trữ. Truyền `expectedSessionId` và `expectedUpdatedAt` khi thao tác xóa không được xung đột với một bản cập nhật phiên đồng thời; sử dụng `expectedSessionId: null` khi ảnh chụp nhanh trước đó không có ID phiên. Các trình trợ giúp này là những bề mặt sửa chữa/vòng đời có phạm vi hẹp, không phải API xóa kho lưu trữ dùng chung.

    `resolveStorePath(...)` và `updateSessionStoreEntry(...)` hoàn thiện bộ trình trợ giúp phiên: `resolveStorePath` phân giải đường dẫn kho lưu trữ phiên cho một phạm vi nhất định, còn `updateSessionStoreEntry({ storePath, sessionKey, update })` vá trực tiếp một mục theo đường dẫn kho lưu trữ khi bên gọi đã biết đường dẫn đó.

    `loadTranscriptEventsSync(...)` dành cho các luồng doctor và sửa chữa đồng bộ không thể sử dụng runtime bản ghi bất đồng bộ. Hàm này trả về các bản ghi `SessionStoreTranscriptEvent` thô. Mã runtime plugin thông thường nên ưu tiên `openclaw/plugin-sdk/session-transcript-runtime`.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)` và `sqliteSessionFileMarkerMatchesSession(...)` là các trình trợ giúp chuyển tiếp dành cho mã vẫn nhận trường cũ có tên `sessionFile`. Một dấu mốc SQLite đã được phân tích cú pháp xác định đích bản ghi SQLite đang hoạt động; đó không phải là đường dẫn hệ thống tệp. Các API mới nên mang danh tính phiên có kiểu thay vì chuỗi dấu mốc.

    Để đọc và ghi bản ghi, hãy nhập `openclaw/plugin-sdk/session-transcript-runtime` và sử dụng `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readSessionTranscriptRawDelta(...)`, `readSessionTranscriptVisibleMessageDelta(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` hoặc `withSessionTranscriptWriteLock(...)` với `{ agentId, sessionKey, sessionId }`. Các API này cho phép plugin xác định một bản ghi, đọc sự kiện thô hoặc các mục thông báo hiển thị an toàn theo nhánh, nối thêm thông báo, phát hành bản cập nhật và chạy các thao tác liên quan dưới cùng một khóa ghi bản ghi mà không phụ thuộc vào đường dẫn tệp bản ghi đang hoạt động. `readVisibleSessionTranscriptMessageEntries(...)` trả về siêu dữ liệu đọc có thứ tự; trường `seq` của nó không phải là con trỏ có thể tiếp tục.

    `readSessionTranscriptRawDelta(...)` trả về kết quả `page`, `reset` hoặc `missing` có giới hạn. Truyền `page.cursor` bất định dạng vào lần gọi tiếp theo. Các thao tác chỉ nối thêm giữ nguyên con trỏ, trong khi việc thay thế bản ghi trả về `reset` cùng con trỏ khởi tạo mới. Mỗi trang mặc định có 1,000 sự kiện và 1,000,000 byte sau tuần tự hóa; bên gọi có thể yêu cầu tối đa 10,000 sự kiện và 64 MiB. Khi chỉ riêng sự kiện tiếp theo đã vượt quá `maxBytes`, trang sẽ trống và báo cáo `requiredBytes`; hãy thử lại với giới hạn byte ít nhất bằng giá trị đó nếu giá trị này không lớn hơn 64 MiB. Các sự kiện riêng lẻ lớn hơn yêu cầu API đọc hoàn chỉnh. Con trỏ chỉ xác định vị trí và không bao giờ cấp quyền truy cập vào phiên khác.

    `readSessionTranscriptVisibleMessageDelta(...)` cung cấp cùng cấu trúc khởi tạo và tiếp tục có giới hạn trên phép chiếu thông báo đang hoạt động do máy chủ sở hữu. Hàm này trả về thông báo từ cũ nhất đến mới nhất để các công cụ ngữ cảnh có thể tiêu thụ hết lịch sử ban đầu và lưu con trỏ bất định dạng làm mốc tiến độ. Hãy lưu trữ và trả về con trỏ mà không thay đổi; đây là gợi ý tiếp tục, không phải thông tin xác thực ủy quyền. Các thao tác nối thêm tuyến tính tiếp tục sau thông báo cuối cùng được trả về. Việc thay thế bản ghi, con trỏ có điểm neo đã rời khỏi hoặc di chuyển trong nhánh đang hoạt động, con trỏ sai định dạng và con trỏ từ phiên khác sẽ trả về `reset` cùng một con trỏ khởi tạo mới. Giá trị mặc định và giới hạn về số lượng cũng như byte khớp với API delta thô. Trong khi phép chiếu đang hoạt động được dựng lại sau khi thay đổi nhánh, kết quả là `unavailable` với lý do `projection_rebuilding`; hãy thử lại sau thay vì quay về sử dụng tệp bản ghi đang hoạt động.

    Các trình trợ giúp cũ dành cho toàn bộ kho lưu trữ và tệp bản ghi đang hoạt động không còn được xuất từ SDK plugin. Hãy sử dụng các trình trợ giúp mục có phạm vi cho siêu dữ liệu phiên và các trình trợ giúp danh tính bản ghi cho thao tác trên bản ghi đang hoạt động. Các quy trình lưu trữ/hỗ trợ cần tạo tác tệp nên sử dụng những bề mặt lưu trữ chuyên dụng thay vì API runtime phiên đang hoạt động.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Các hằng số mô hình và nhà cung cấp mặc định:

    ```typescript
    const model = api.runtime.agent.defaults.model; // ví dụ: "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // ví dụ: "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Chạy một tác vụ hoàn thành văn bản do máy chủ sở hữu mà không cần nhập các thành phần nội bộ của nhà cung cấp hoặc
    sao chép quá trình chuẩn bị mô hình/xác thực/URL cơ sở của OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Tóm tắt bản ghi này." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
      reasoning: "high",
    });
    ```

    Lớp điều phối nhà cung cấp cũng có thể tiếp nhận vòng đời dịch vụ cục bộ đã cấu hình
    trước khi gửi yêu cầu HTTP:

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // Gửi và tiêu thụ đầy đủ yêu cầu của nhà cung cấp.
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` là một hợp đồng SDK dịch vụ nhà cung cấp chung và ổn định.
    Máy chủ phân giải cấu hình tiến trình từ
    `models.providers.<providerId>.localService`; bên gọi không thể cung cấp
    lệnh, đối số, môi trường hoặc chính sách vòng đời. Việc khởi tạo tiến trình,
    kiểm tra mức độ sẵn sàng, chẩn đoán và chính sách dừng khi nhàn rỗi vẫn là nội bộ của máy chủ.

    Hãy truyền chính xác ID nhà cung cấp đã cấu hình và URL cơ sở của yêu cầu đã phân giải. Không
    thay bí danh bằng ID bộ điều hợp: các bí danh riêng biệt có thể trỏ đến các
    máy chủ GPU cục bộ riêng biệt. Máy chủ từ chối các điểm cuối không khớp với URL cơ sở
    của nhà cung cấp đã cấu hình, ngoại trừ phép chuẩn hóa `/v1` được các bộ điều hợp Ollama và LM
    Studio sử dụng. Máy chủ sở hữu việc tuần tự hóa khởi động, các phép thăm dò mức độ sẵn sàng,
    quyền thuê yêu cầu, xử lý hủy bỏ và tắt khi nhàn rỗi.

    Trình trợ giúp sử dụng cùng đường dẫn chuẩn bị tác vụ hoàn thành đơn giản như runtime
    tích hợp sẵn của OpenClaw và ảnh chụp nhanh cấu hình runtime do máy chủ sở hữu. Các công cụ ngữ cảnh
    nhận khả năng `llm.complete` gắn với phiên, vì vậy các lần gọi mô hình sử dụng
    tác nhân của phiên đang hoạt động và không âm thầm quay về tác nhân mặc định. Kết quả
    bao gồm thông tin quy thuộc nhà cung cấp/mô hình/tác nhân cùng mức sử dụng token,
    bộ nhớ đệm và chi phí ước tính đã chuẩn hóa khi có sẵn.

    Đặt `reasoning` để yêu cầu mức độ suy luận cho mô hình đã chọn.
    Máy chủ chuẩn hóa các cấp độ tư duy chuẩn (`off`, `minimal`, `low`,
    `medium`, `high`, `xhigh`, `adaptive`, `max` và `ultra`) cho nhà cung cấp
    và mô hình đã chọn trước khi gửi tác vụ hoàn thành. `adaptive` trở thành
    `medium`; `max` và `ultra` trở thành `max` khi được hỗ trợ, nếu không thì thành `xhigh`.

    <Warning>
    Ghi đè mô hình yêu cầu người vận hành chủ động cho phép qua `plugins.entries.<id>.llm.allowModelOverride: true` trong cấu hình. Sử dụng `plugins.entries.<id>.llm.allowedModels` để giới hạn các plugin đáng tin cậy ở những đích `provider/model` chuẩn cụ thể. Các tác vụ hoàn thành xuyên tác nhân yêu cầu `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    Gọi một phương thức Gateway khác trong cùng tiến trình đồng thời giữ nguyên danh tính runtime đáng tin cậy
    của plugin hiện tại. Tính năng này dành cho các plugin tích hợp sẵn hoặc plugin chính thức đáng tin cậy kết hợp các khả năng
    Gateway do plugin sở hữu mà không mở kết nối WebSocket vòng lặp.

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    Các yêu cầu sử dụng phạm vi `operator.write` và không cấp phạm vi quản trị. Các lệnh gọi từ plugin bên ngoài tùy ý
    sẽ bị từ chối. Các phương thức thất bại ném ra `GatewayClientRequestError`, đồng thời giữ nguyên
    `details` có cấu trúc, siêu dữ liệu thử lại và mã lỗi Gateway cho các luồng khôi phục. Sử dụng `isAvailable()`
    trước khi chọn đường dẫn này từ các công cụ cũng có thể chạy trong tiến trình tác nhân độc lập.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Khởi chạy và quản lý các lượt chạy tác nhân phụ trong nền.

    ```typescript
    // Bắt đầu một lượt chạy tác nhân phụ
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Mở rộng truy vấn này thành các lượt tìm kiếm tiếp nối có trọng tâm.",
      toolsAlsoAllow: ["my_plugin_progress"],
      provider: "openai", // ghi đè tùy chọn
      model: "gpt-5.6-sol", // ghi đè tùy chọn
      deliver: false,
    });

    // Chờ hoàn tất
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Đọc thông báo phiên
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Xóa một phiên
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Ghi đè mô hình (`provider`/`model`) yêu cầu người vận hành chủ động cho phép qua `plugins.entries.<id>.subagent.allowModelOverride: true` trong cấu hình. Các plugin không đáng tin cậy vẫn có thể chạy tác nhân phụ, nhưng yêu cầu ghi đè sẽ bị từ chối.
    </Warning>

    `toolsAlsoAllow` bổ sung các công cụ chính xác, thuộc sở hữu duy nhất, do plugin gọi đăng ký vào bề mặt công cụ thông thường của worker. Runtime từ chối các công cụ lõi và những tên được dùng chung với plugin khác. Hồ sơ và chính sách công cụ của người vận hành vẫn được áp dụng, bao gồm danh sách cho phép và danh sách từ chối rõ ràng.

    `deleteSession(...)` có thể xóa các phiên do cùng một plugin tạo thông qua `api.runtime.subagent.run(...)`. Việc xóa phiên tùy ý của người dùng hoặc người vận hành vẫn yêu cầu một yêu cầu Gateway có phạm vi quản trị.

  </Accordion>
  <Accordion title="api.runtime.sandbox">
    Kiểm tra thẩm quyền không gian làm việc sandbox có hiệu lực cho một phiên tác nhân.

    ```typescript
    const authority = api.runtime.sandbox.resolveWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
    });

    const liveAuthority = await api.runtime.sandbox.prepareWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
      workspaceDir,
      confinedToolNames: ["my_plugin_safe_tool"],
    });
    ```

    Kết quả cho biết phiên này có được đặt trong sandbox hay không, không gian làm việc của phiên
    không khả dụng, chỉ đọc hay có thể ghi, cùng một `confinementError` tùy chọn
    khi chính sách Docker, công cụ, phiên, trình duyệt hoặc đặc quyền có hiệu lực có thể
    thoát khỏi không gian làm việc đó. Hãy sử dụng tính năng này cho các quyết định ủy quyền do máy chủ sở hữu
    vốn không được cấp cho worker nhiều thẩm quyền hơn bên gọi. Đây là một trình trợ giúp
    chứng thực, không thay thế việc kiểm tra quyền hạn của chính bên gọi.

    `prepareWorkspaceAuthority(...)` thực hiện cùng phép kiểm tra chính sách và cũng
    chuẩn bị sandbox Docker cho `workspaceDir`. Hàm này từ chối một vùng chứa đang hoạt động
    có hàm băm cấu hình trực tiếp không khớp với các điểm gắn kết hoặc chính sách được yêu cầu. Chỉ truyền
    tên chính xác của những công cụ có phần triển khai đã đăng ký được plugin gọi
    giới hạn; tiền tố ký tự đại diện không chứng minh quyền sở hữu công cụ.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liệt kê các Node đã kết nối và gọi một lệnh trên máy chủ Node từ mã plugin được Gateway tải hoặc từ các lệnh CLI của plugin. Sử dụng tính năng này khi một plugin sở hữu công việc cục bộ trên thiết bị đã ghép đôi, chẳng hạn như cầu nối trình duyệt hoặc âm thanh trên một máy Mac khác.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` bao gồm các bộ mô tả `nodePluginTools` được quảng bá
    của từng Node đã kết nối khi Node đó cung cấp các công cụ được plugin hoặc MCP hỗ trợ
    cho tác nhân. Các bộ mô tả đó là trạng thái kết nối trực tiếp: Gateway
    loại bỏ chúng khi Node ngắt kết nối và một Node có thể thay thế chúng bằng
    `node.pluginTools.update` sau khi danh mục plugin/MCP cục bộ thay đổi.

    Bên trong Gateway, runtime này chạy trong cùng tiến trình. Trong các lệnh CLI của plugin, nó gọi Gateway đã cấu hình qua RPC, vì vậy các lệnh như `openclaw googlemeet recover-tab` có thể kiểm tra các node đã ghép cặp từ terminal. Các lệnh Node vẫn đi qua quy trình ghép cặp node thông thường của Gateway, danh sách cho phép lệnh, chính sách gọi node của plugin và cơ chế xử lý lệnh cục bộ tại node.

    Các plugin cung cấp công cụ tác nhân được lưu trữ trên node có thể đặt `agentTool.defaultPlatforms` cho các lệnh không nguy hiểm cần được đưa vào danh sách cho phép theo mặc định. Bỏ qua trường này khi người vận hành phải chủ động cho phép bằng `gateway.nodes.allowCommands`. Các lệnh nguy hiểm trên máy chủ node phải đăng ký chính sách gọi node bằng `api.registerNodeInvokePolicy(...)`; chính sách này chạy trong Gateway sau khi kiểm tra danh sách cho phép lệnh và trước khi lệnh được chuyển tiếp đến node, nhờ đó các lệnh gọi trực tiếp `node.invoke`, công cụ plugin được lưu trữ trên node và công cụ plugin cấp cao hơn cùng dùng chung một đường dẫn thực thi chính sách.

    <Warning>
    Trường `scopes` tùy chọn yêu cầu các phạm vi của người vận hành Gateway cho lời gọi. OpenClaw chỉ chấp nhận trường này đối với các plugin đi kèm và các bản cài đặt plugin chính thức đáng tin cậy; yêu cầu từ các plugin khác không nâng quyền cho lời gọi. Chỉ sử dụng trường này khi một plugin đáng tin cậy phải gọi lệnh node với phạm vi Gateway nghiêm ngặt hơn, chẳng hạn như `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Liên kết trạng thái Task Flow và Task Run với khóa phiên OpenClaw hiện có hoặc ngữ cảnh công cụ đáng tin cậy.

    - `api.runtime.tasks.managedFlows` có khả năng thay đổi trạng thái: tạo, chuyển tiếp và hủy Task Flow.
    - `api.runtime.tasks.flows` và `api.runtime.tasks.runs` là các chế độ xem DTO chỉ đọc để liệt kê và tra cứu trạng thái; cả hai đều cung cấp `bindSession(...)` / `fromToolContext(...)` cùng với `get`, `list`, `findLatest` và `resolve`.

    Task Flow theo dõi trạng thái quy trình công việc nhiều bước có tính bền vững. Đây không phải là bộ lập lịch:
    hãy dùng Cron hoặc `api.session.workflow.scheduleSessionTurn(...)` cho các lần
    đánh thức trong tương lai, sau đó dùng `managedFlows` từ lượt đã lên lịch khi công việc đó
    cần trạng thái luồng, tác vụ con, chờ đợi hoặc hủy bỏ.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Review new pull requests",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Review PR #123",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    Sử dụng `bindSession({ sessionKey, requesterOrigin })` khi bạn đã có khóa phiên OpenClaw đáng tin cậy từ lớp liên kết của riêng mình. Không liên kết từ dữ liệu đầu vào thô của người dùng.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Tổng hợp văn bản thành giọng nói.

    ```typescript
    // TTS tiêu chuẩn
    const clip = await api.runtime.tts.textToSpeech({
      text: "Xin chào từ OpenClaw",
      cfg: api.config,
    });

    // TTS được tối ưu hóa cho điện thoại
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Xin chào từ OpenClaw",
      cfg: api.config,
    });

    // Liệt kê các giọng nói khả dụng
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Sử dụng cấu hình `messages.tts` cốt lõi và lựa chọn nhà cung cấp. Trả về bộ đệm âm thanh PCM cùng tốc độ lấy mẫu. `textToSpeechStream` cũng khả dụng cho tổng hợp dạng luồng.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Phân tích hình ảnh, âm thanh và video.

    ```typescript
    // Mô tả hình ảnh
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Chuyển âm thanh thành văn bản
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // tùy chọn, dùng khi không thể suy ra MIME
    });

    // Mô tả video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Phân tích tệp tổng quát
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Trích xuất hình ảnh có cấu trúc thông qua một nhà cung cấp/mô hình cụ thể.
    // Bao gồm ít nhất một hình ảnh; dữ liệu văn bản là ngữ cảnh bổ sung.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Ưu tiên tổng số được in thay vì ghi chú viết tay." },
      ],
      instructions: "Trích xuất nhà cung cấp, tổng số và các thẻ có thể tìm kiếm.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    Trả về `{ text: undefined }` khi không tạo ra đầu ra nào (ví dụ: dữ liệu đầu vào bị bỏ qua).

    `describeImageFileWithModel(...)` mô tả một hình ảnh đã biết thông qua một nhà cung cấp/mô hình cụ thể, bỏ qua bước phân giải mô hình đang hoạt động mặc định mà `describeImageFile(...)` sử dụng.

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Tạo hình ảnh.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "Một robot đang vẽ cảnh hoàng hôn",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    Tạo video, có cấu trúc tương tự tính năng tạo hình ảnh.

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "Cảnh quay từ máy bay không người lái bay qua bờ biển lúc bình minh",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    Tạo nhạc, có cấu trúc tương tự tính năng tạo hình ảnh.

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "Một bản nhạc lo-fi sôi động cho phiên lập trình",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Tìm kiếm trên web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "SDK plugin OpenClaw", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Tiện ích phương tiện cấp thấp.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "hình ảnh"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    Ảnh chụp nhanh cấu hình runtime hiện tại và thao tác ghi cấu hình theo giao dịch. Ưu tiên
    cấu hình đã được truyền vào đường dẫn lời gọi đang hoạt động; chỉ sử dụng
    `current()` khi trình xử lý cần trực tiếp ảnh chụp nhanh của tiến trình.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` và `replaceConfigFile(...)` trả về một giá trị `followUp`,
    ví dụ `{ mode: "restart", requiresRestart: true, reason }`,
    ghi lại ý định của trình ghi mà không tước quyền kiểm soát khởi động lại khỏi
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Tiện ích cấp hệ thống.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Bí danh tương thích đã lỗi thời.
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` chạy ngay một chu kỳ Heartbeat duy nhất, bỏ qua bộ hẹn giờ gộp thông thường. Truyền `{ heartbeat: { target: "last" } }` để buộc phân phối đến kênh hoạt động gần nhất thay vì cơ chế chặn `target: "none"` mặc định.

    `runCommandWithTimeout(...)` trả về `stdout` và `stderr` đã thu thập, số lượng
    cắt bớt tùy chọn, `code`, `signal`, `killed`, `termination` và
    `noOutputTimedOut`. Kết quả hết thời gian chờ và hết thời gian chờ do không có đầu ra báo cáo `code: 124`
    khi tiến trình con không cung cấp mã thoát khác 0. Các lần thoát do tín hiệu
    không liên quan đến hết thời gian chờ vẫn có thể trả về `code: null`, vì vậy hãy dùng `termination` và
    `noOutputTimedOut` để phân biệt các nguyên nhân hết thời gian chờ.

  </Accordion>
  <Accordion title="api.runtime.events">
    Đăng ký sự kiện.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Ghi nhật ký.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Phân giải xác thực mô hình và nhà cung cấp.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // Xác thực sẵn sàng cho yêu cầu, bao gồm trao đổi runtime của nhà cung cấp (ví dụ: làm mới OAuth)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Phân giải thư mục trạng thái và lưu trữ theo khóa dựa trên SQLite.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.deleteIf?.("key-1", (current) => current.value === "hello");
    await store.consume("key-1");
    await store.clear();

    const blobs = api.runtime.state.openBlobStore<MyBlobMetadata>({
      namespace: "rendered-artifacts",
      maxEntries: 100,
      maxBytesPerEntry: 4 * 1024 * 1024,
      maxBytesPerNamespace: 64 * 1024 * 1024,
      defaultTtlMs: 15 * 60_000,
    });
    await blobs.register(
      "artifact-1",
      new TextEncoder().encode("binary or text payload"),
      { contentType: "text/plain" },
    );
    const blob = await blobs.lookup("artifact-1");

    await api.runtime.state.withLease(
      {
        namespace: "my-feature",
        key: "writer",
        database: { scope: "agent", agentId },
        leaseMs: 5 * 60_000,
        waitMs: 30_000,
      },
      async ({ signal, assertOwned }) => {
        await runExternalWriter({ signal });
        assertOwned();
      },
    );
    ```

    Các kho lưu trữ theo khóa vẫn tồn tại sau khi khởi động lại và được cô lập theo id plugin gắn với runtime. Sử dụng `registerIfAbsent(...)` cho các yêu cầu chống trùng lặp nguyên tử: phương thức này trả về `true` khi khóa chưa tồn tại hoặc đã hết hạn và được đăng ký, hoặc `false` khi một giá trị còn hiệu lực đã tồn tại mà không ghi đè giá trị, thời điểm tạo hoặc TTL của nó. Sử dụng `deleteIf(...)` khi quá trình dọn dẹp chỉ được phép xóa giá trị đã quan sát trước đó; vị từ đồng bộ và thao tác xóa của phương thức này chạy trong một giao dịch SQLite. Các giới hạn: `maxEntries` trên mỗi không gian tên, 50,000 hàng còn hiệu lực trên mỗi plugin, giá trị JSON dưới 64KB và thời hạn TTL tùy chọn. Theo mặc định, thao tác ghi khi đạt một trong hai giới hạn hàng sẽ loại bỏ các hàng còn hiệu lực cũ nhất khỏi không gian tên đang được ghi; các không gian tên ngang hàng không bị loại bỏ cho thao tác ghi đó, và thao tác ghi vẫn thất bại nếu không gian tên không thể giải phóng đủ số hàng. Đặt `overflowPolicy: "reject-new"` cho các bản ghi quyền sở hữu bền vững không bao giờ được phép bị loại bỏ: khóa mới sẽ thất bại khi đạt một trong hai giới hạn, trong khi khóa hiện có vẫn có thể được cập nhật.

    `openSyncKeyedStore<T>(...)` trả về cùng cấu trúc kho lưu trữ với các phương thức đồng bộ (`register`, `registerIfAbsent`, `deleteIf`, `lookup`, `consume`, `clear` đều trả về giá trị trực tiếp thay vì promise) dành cho các bên gọi không thể dùng await.

    `openBlobStore<TMetadata>(...)` lưu trữ các payload nhị phân có giới hạn trong SQLite dùng chung mà không cần base64 hoặc tệp sidecar. Phương thức này yêu cầu các giới hạn theo từng mục nhập, theo số byte của từng không gian tên và theo số hàng; sao chép các mảng byte tại ranh giới API; đồng thời liệt kê siêu dữ liệu mà không tải mọi BLOB. `register(...)` là thao tác upsert tường minh, bao gồm cả với khóa đã hết hạn. `registerIfAbsent(...)` cung cấp khả năng tạo an toàn khi xảy ra xung đột: khóa đã hết hạn vẫn được xem là đang bị chiếm dụng cho đến khi chủ sở hữu yêu cầu khóa đó bằng `deleteExpiredKey(key)` hoặc `deleteExpired()`, qua đó bảo toàn siêu dữ liệu cần thiết để xóa các tạo tác có tên liên quan sau khi giao dịch SQLite được commit. Mọi hàng có TTL đều là tạm thời và bị loại khỏi quá trình sao lưu/khôi phục ngay cả trước khi hết hạn; bỏ qua TTL đối với trạng thái bền vững, có thể khôi phục. Các cầu chì của máy chủ giới hạn mỗi BLOB ở 100 MiB, mỗi plugin ở 512 MiB BLOB được lưu trữ vật lý và mỗi plugin ở 50,000 hàng được lưu trữ vật lý, bao gồm cả các hàng đã hết hạn đang chờ chủ sở hữu dọn dẹp. Sử dụng `registerIfAbsent(...)` cùng `overflowPolicy: "reject-new"` khi các bản hiện thực hóa bên ngoài không được phép âm thầm trở thành mồ côi do thay thế hoặc loại bỏ.

    `openChannelIngressQueue<TPayload>(...)` mở một hàng đợi đầu vào được lưu bền vững, có phạm vi giới hạn trong plugin gọi, để lưu đệm các sự kiện đến cần được xử lý ít nhất một lần qua các lần khởi động lại. Khi khôi phục yêu cầu cũ sử dụng `shouldRecover`, hãy cung cấp thêm `shouldRecoverCorrupt` nếu các payload đã được yêu cầu nhưng bị hỏng cần được cách ly: danh tính yêu cầu không phụ thuộc vào payload của nó cho phép plugin bảo toàn chính sách về chủ sở hữu đang hoạt động và làn trước khi hàng đợi tạo bia mộ cho hàng đó.

    `withLease(...)` tuần tự hóa công việc plugin có tính hợp tác giữa các tiến trình OpenClaw. Chọn `database: { scope: "shared" }` cho một chủ sở hữu toàn cục hoặc `{ scope: "agent", agentId }` cho quyền sở hữu độc lập theo từng tác nhân. Chuyển tiếp `AbortSignal` của callback vào mọi thao tác có thể thất bại. `assertOwned()` là một điểm kiểm tra tại một thời điểm trước khi bắt đầu một bước quan trọng khác; máy chủ cũng xác minh quyền sở hữu sau callback. Việc mất lease hoặc bên gọi hủy sẽ hủy tín hiệu. Quá trình chờ nhận quyền và Heartbeat diễn ra bên ngoài các giao dịch SQLite đồng bộ ngắn; plugin không bao giờ nhận đường dẫn hoặc handle cơ sở dữ liệu. Đây là cơ chế hủy hợp tác, không phải fencing token hoặc sự ủy quyền cho các thao tác ghi bên ngoài không được bảo vệ bằng fencing.

    `openChannelIngressDrain(...)` mở worker lõi không phụ thuộc vào kênh trên hàng đợi đó (hoặc tạo một hàng đợi khi không được cung cấp). Quá trình rút hàng đợi sở hữu việc khôi phục yêu cầu cũ, tuần tự hóa yêu cầu theo từng làn, hoàn tất khi tiếp nhận hoặc hoàn tất khi thao tác điều phối trả về, xử lý thử lại/thư chết, ghi đè trước khi tiếp nhận theo tùy chọn và thời gian chờ khi yêu cầu→tiếp nhận bị đình trệ. Kết nối quyền sở hữu yêu cầu vào quá trình tạo phản hồi bằng `turnAdoptionLifecycle` (thông qua `bindIngressLifecycleToReplyOptions` từ `plugin-sdk/channel-outbound`). Các plugin kênh tiếp tục quản lý việc đưa vào hàng đợi ở phía tiếp nhận, xác định làn, phân loại trường hợp không thể thử lại và mọi chính sách ủy quyền ghi đè.

    <Warning>
    `openBlobStore`, `openKeyedStore`, `openSyncKeyedStore`, `withLease`, `openChannelIngressQueue` và `openChannelIngressDrain` chỉ dành cho các plugin đi kèm và các bản cài đặt plugin chính thức đáng tin cậy trong bản phát hành này.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Các trình trợ giúp runtime dành riêng cho kênh (khả dụng khi một plugin kênh được tải). Được nhóm theo chức năng:

    | Nhóm | Mục đích |
    | --- | --- |
    | `text` | Chia khối (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), phát hiện lệnh điều khiển, chuyển đổi bảng Markdown. |
    | `reply` | Điều phối phản hồi theo khối được lưu đệm, định dạng phong bì, phân giải cấu hình tin nhắn hiệu dụng/độ trễ giống con người. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, đọc/xóa danh sách cho phép, upsert yêu cầu ghép nối và các mục phê duyệt bắt nguồn từ yêu cầu. |
    | `media` | Tải xuống/lưu phương tiện từ xa (xem bên dưới). |
    | `activity` | Ghi/đọc hoạt động kênh gần nhất. |
    | `session` | Siêu dữ liệu phiên từ các sự kiện đến, cập nhật tuyến gần nhất. |
    | `mentions` | Trình trợ giúp chính sách đề cập (xem bên dưới). |
    | `reactions` | Handle phản ứng xác nhận cho các chỉ báo xử lý đang diễn ra. |
    | `groups` | Phân giải chính sách nhóm và yêu cầu đề cập. |
    | `debounce` | Chống dội tin nhắn đến. |
    | `commands` | Ủy quyền lệnh và kiểm soát lệnh văn bản. |
    | `outbound` | Tải bộ điều hợp đầu ra của một kênh. |
    | `inbound` | Xây dựng ngữ cảnh sự kiện đến và chạy nhân sự kiện đến/phản hồi dùng chung. |
    | `threadBindings` | Điều chỉnh thời gian chờ khi không hoạt động/tuổi tối đa cho các luồng phiên đã liên kết. |
    | `runtimeContexts` | Đăng ký, đọc và theo dõi ngữ cảnh cục bộ trong tiến trình theo từng kênh/tài khoản/năng lực. |

    `api.runtime.channel.media` là bề mặt được ưu tiên để tải xuống và lưu trữ phương tiện của kênh:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Sử dụng `saveRemoteMedia(...)` khi một URL từ xa cần trở thành phương tiện OpenClaw. Sử dụng `saveResponseMedia(...)` khi plugin đã tìm nạp một `Response` với cơ chế xác thực, chuyển hướng hoặc xử lý danh sách cho phép do plugin sở hữu. Chỉ sử dụng `readRemoteMediaBuffer(...)` khi plugin cần byte thô để kiểm tra, biến đổi, giải mã hoặc tải lên lại. `fetchRemoteMedia(...)` vẫn là một bí danh tương thích đã lỗi thời cho `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` là bề mặt chính sách đề cập đầu vào dùng chung dành cho các plugin kênh đi kèm sử dụng cơ chế tiêm runtime:

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    Các trình trợ giúp đề cập khả dụng:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    Sử dụng đường dẫn `{ facts, policy }` đã chuẩn hóa cho các quyết định đề cập.

    Một số trường trong `reply`, `session` và `inbound` chứa các ghi chú `@deprecated` theo từng trường, trỏ đến nhân lượt kênh hiện tại hoặc các bộ điều hợp đầu ra của kênh; hãy kiểm tra JSDoc nội tuyến trên trình trợ giúp cụ thể trước khi xây dựng mã mới dựa trên đó.

  </Accordion>
</AccordionGroup>

## Lưu trữ tham chiếu runtime

Sử dụng `createPluginRuntimeStore` để lưu trữ tham chiếu runtime nhằm sử dụng bên ngoài callback `register`:

<Steps>
  <Step title="Tạo kho lưu trữ">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Kết nối vào điểm vào">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Truy cập từ các tệp khác">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Ưu tiên `pluginId` cho danh tính của kho lưu trữ runtime. Dạng cấp thấp hơn `key` dành cho các trường hợp ít gặp khi một plugin cố ý cần nhiều hơn một vị trí runtime.
</Note>

## Các trường `api` cấp cao nhất khác

Ngoài `api.runtime`, đối tượng API còn cung cấp:

<ParamField path="api.id" type="string">
  Id plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Tên hiển thị của plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Ảnh chụp cấu hình hiện tại (ảnh chụp runtime đang hoạt động trong bộ nhớ khi có).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Cấu hình dành riêng cho plugin từ `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Trình ghi nhật ký theo phạm vi (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Chế độ tải hiện tại: `"full"` (kích hoạt trực tiếp), `"discovery"` / `"tool-discovery"` (khám phá năng lực chỉ đọc), `"setup-only"` (điểm vào thiết lập nhẹ), `"setup-runtime"` (luồng thiết lập cũng cần điểm vào kênh runtime) hoặc `"cli-metadata"` (thu thập siêu dữ liệu lệnh CLI).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Phân giải đường dẫn tương đối so với thư mục gốc của plugin.
</ParamField>

## Liên quan

- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình khả năng và sổ đăng ký
- [Các điểm vào SDK](/vi/plugins/sdk-entrypoints) — các tùy chọn `definePluginEntry`
- [Tổng quan về SDK](/vi/plugins/sdk-overview) — tài liệu tham khảo đường dẫn con
