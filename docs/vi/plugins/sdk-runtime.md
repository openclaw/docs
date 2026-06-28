---
read_when:
    - Bạn cần gọi các helper lõi từ một plugin (TTS, STT, tạo ảnh, tìm kiếm web, subagent, node)
    - Bạn muốn hiểu api.runtime cung cấp những gì
    - Bạn đang truy cập các trình trợ giúp cấu hình, agent hoặc phương tiện từ mã plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- các trình trợ giúp thời gian chạy được chèn vào có sẵn cho các Plugin
title: Plugin runtime helpers
x-i18n:
    generated_at: "2026-06-28T20:44:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Tài liệu tham chiếu cho đối tượng `api.runtime` được chèn vào mọi Plugin trong quá trình đăng ký. Hãy dùng các helper này thay vì nhập trực tiếp nội bộ host.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/vi/plugins/sdk-channel-plugins">
    Hướng dẫn từng bước sử dụng các helper này trong ngữ cảnh cho Plugin kênh.
  </Card>
  <Card title="Provider plugins" href="/vi/plugins/sdk-provider-plugins">
    Hướng dẫn từng bước sử dụng các helper này trong ngữ cảnh cho Plugin nhà cung cấp.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Tải và ghi cấu hình

Ưu tiên cấu hình đã được truyền vào đường dẫn lời gọi đang hoạt động, ví dụ `api.config` trong quá trình đăng ký hoặc đối số `cfg` trên callback kênh/nhà cung cấp. Cách này giữ một snapshot tiến trình duy nhất đi xuyên suốt công việc thay vì phân tích lại cấu hình trên các đường dẫn nóng.

Chỉ dùng `api.runtime.config.current()` khi một handler tồn tại lâu cần snapshot tiến trình hiện tại và không có cấu hình nào được truyền vào hàm đó. Giá trị trả về là readonly; hãy sao chép hoặc dùng helper mutation trước khi chỉnh sửa.

Tool factory nhận `ctx.runtimeConfig` cùng với `ctx.getRuntimeConfig()`. Dùng getter bên trong callback `execute` của một tool tồn tại lâu khi cấu hình có thể thay đổi sau khi định nghĩa tool được tạo.

Lưu thay đổi bằng `api.runtime.config.mutateConfigFile(...)` hoặc `api.runtime.config.replaceConfigFile(...)`. Mỗi lần ghi phải chọn một chính sách `afterWrite` rõ ràng:

- `afterWrite: { mode: "auto" }` để logic tải lại Gateway quyết định.
- `afterWrite: { mode: "restart", reason: "..." }` buộc khởi động lại sạch khi bên ghi biết tải lại nóng là không an toàn.
- `afterWrite: { mode: "none", reason: "..." }` chỉ chặn tự động tải lại/khởi động lại khi bên gọi sở hữu bước tiếp theo.

Các helper mutation trả về `afterWrite` cùng một tóm tắt `followUp` có kiểu để bên gọi có thể ghi log hoặc kiểm thử xem họ đã yêu cầu khởi động lại hay chưa. Gateway vẫn sở hữu thời điểm lần khởi động lại đó thực sự diễn ra.

`api.runtime.config.loadConfig()` và `api.runtime.config.writeConfigFile(...)` là các helper tương thích đã deprecated trong `runtime-config-load-write`. Chúng cảnh báo một lần khi chạy, và vẫn khả dụng cho Plugin bên ngoài cũ trong giai đoạn migration. Plugin đóng gói không được dùng chúng; các guard ranh giới cấu hình sẽ fail nếu mã Plugin gọi chúng hoặc nhập các helper đó từ các subpath Plugin SDK.

Đối với import SDK trực tiếp, hãy dùng các subpath cấu hình tập trung thay vì compatibility barrel rộng
`openclaw/plugin-sdk/config-runtime`: `config-contracts` cho
kiểu, `plugin-config-runtime` cho assertion cấu hình đã tải và lookup entry Plugin,
`runtime-config-snapshot` cho snapshot tiến trình hiện tại, và
`config-mutation` cho thao tác ghi. Kiểm thử Plugin đóng gói nên mock trực tiếp các
subpath tập trung này thay vì mock compatibility barrel rộng.

Mã runtime nội bộ của OpenClaw đi theo cùng hướng: tải cấu hình một lần tại ranh giới CLI, Gateway hoặc tiến trình, rồi truyền giá trị đó xuyên suốt. Các lần ghi mutation thành công làm mới snapshot runtime của tiến trình và tăng revision nội bộ của nó; cache tồn tại lâu nên dựa vào cache key do runtime sở hữu thay vì tuần tự hóa cấu hình cục bộ. Các module runtime tồn tại lâu có scanner không khoan nhượng với các lời gọi `loadConfig()` ngầm; hãy dùng `cfg` được truyền vào, request `context.getRuntimeConfig()`, hoặc `getRuntimeConfig()` tại một ranh giới tiến trình rõ ràng.

Các đường dẫn thực thi nhà cung cấp và kênh phải dùng snapshot cấu hình runtime đang hoạt động, không phải snapshot file được trả về để đọc lại hoặc chỉnh sửa cấu hình. Snapshot file giữ nguyên các giá trị nguồn như marker SecretRef cho UI và thao tác ghi; callback nhà cung cấp cần góc nhìn runtime đã được resolved. Khi một helper có thể được gọi với snapshot nguồn đang hoạt động hoặc snapshot runtime đang hoạt động, hãy đi qua `selectApplicableRuntimeConfig()` trước khi đọc thông tin xác thực.

## Tiện ích runtime có thể tái sử dụng

Dùng dữ kiện `botLoopProtection` inbound cho các tin nhắn inbound do bot tạo. Core áp dụng guard sliding-window trong bộ nhớ dùng chung trước khi ghi session và dispatch, mà không buộc chính sách vào một kênh duy nhất. Guard theo dõi key `(scopeId, conversationId, participant pair)`, đếm cả hai chiều của một cặp cùng nhau, áp dụng cooldown khi vượt quá ngân sách cửa sổ, và opportunistically dọn các entry không hoạt động.

Plugin kênh phơi bày hành vi này cho operator nên ưu tiên shape `channels.defaults.botLoopProtection` dùng chung cho ngân sách baseline, rồi phủ các override riêng theo kênh/nhà cung cấp lên trên. Cấu hình dùng chung dùng giây vì đây là phần hướng tới người dùng:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Truyền các dữ kiện cặp bot đã chuẩn hóa cùng lượt đã resolved. Core xử lý default, chuyển đổi đơn vị và ngữ nghĩa `enabled`:

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

Chỉ dùng trực tiếp `openclaw/plugin-sdk/pair-loop-guard-runtime` cho các vòng lặp sự kiện hai bên tùy chỉnh không đi qua shared inbound reply runner.

## Namespace runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Danh tính agent, thư mục và quản lý session.

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validate a user-provided thinking level against the active provider profile
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pass level to an embedded run
    }

    // Get agent timeout
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Ensure workspace exists
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Run an embedded agent turn
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` là helper trung lập để bắt đầu một lượt agent OpenClaw bình thường từ mã Plugin. Nó dùng cùng quá trình resolve nhà cung cấp/model và lựa chọn agent-harness như các phản hồi được kích hoạt từ kênh.

    `runEmbeddedPiAgent(...)` vẫn là alias tương thích đã deprecated cho các Plugin hiện có. Mã mới nên dùng `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` trả về các mức thinking được hỗ trợ của nhà cung cấp/model và default tùy chọn. Plugin nhà cung cấp sở hữu profile riêng theo model thông qua các hook thinking của chúng, vì vậy Plugin tool nên gọi helper runtime này thay vì nhập hoặc sao chép danh sách nhà cung cấp.

    `normalizeThinkingLevel(...)` chuyển văn bản người dùng như `on`, `x-high`, hoặc `extra high` thành mức lưu trữ canonical trước khi kiểm tra nó với policy đã resolved.

    **Helper session store** nằm trong `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterate session rows without depending on the legacy sessions.json shape.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });
    ```

    Ưu tiên `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)`, hoặc `upsertSessionEntry(...)` cho workflow session. Các helper này định địa chỉ session theo danh tính agent/session để Plugin không phụ thuộc vào shape lưu trữ `sessions.json` legacy. Dùng `preserveActivity: true` cho các patch chỉ metadata không nên làm mới hoạt động session, và chỉ dùng `replaceEntry: true` khi callback trả về một entry hoàn chỉnh và các trường đã xóa phải tiếp tục bị xóa.

    Để đọc và ghi transcript, hãy import `openclaw/plugin-sdk/session-transcript-runtime` và dùng `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)`, hoặc `withSessionTranscriptWriteLock(...)` với `{ agentId, sessionKey, sessionId }`. Các API này cho phép Plugin xác định một transcript, đọc event của nó, append message, publish update, và chạy các thao tác liên quan dưới cùng write lock transcript. Truyền `sessionFile`, dùng `resolveSessionTranscriptLegacyFileTarget(...)`, hoặc import các hàm cấp thấp `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` từ `openclaw/plugin-sdk/agent-harness-runtime` đã deprecated; các đường dẫn đó chỉ tồn tại cho mã legacy đã nhận một artifact transcript đang hoạt động.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)`, và `resolveAndPersistSessionFile(...)` là các helper tương thích đã deprecated cho Plugin vẫn cố ý phụ thuộc vào whole-store legacy hoặc shape transcript-file. Mã Plugin mới không được dùng các helper đó, và các caller hiện có nên migration sang helper entry và helper danh tính transcript.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Hằng số model và nhà cung cấp default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Chạy một text completion do host sở hữu mà không cần nhập nội bộ nhà cung cấp hoặc
    sao chép quá trình chuẩn bị model/auth/base URL của OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Helper này dùng cùng đường dẫn chuẩn bị simple-completion như runtime tích hợp của OpenClaw
    và snapshot cấu hình runtime do host sở hữu. Context engine nhận capability `llm.complete`
    gắn với session, vì vậy các lời gọi model dùng agent của session đang hoạt động và không
    âm thầm fallback sang agent default. Kết quả bao gồm attribution nhà cung cấp/model/agent
    cùng usage token, cache và chi phí ước tính đã chuẩn hóa khi có sẵn.

    <Warning>
    Override model yêu cầu operator opt-in qua `plugins.entries.<id>.llm.allowModelOverride: true` trong cấu hình. Dùng `plugins.entries.<id>.llm.allowedModels` để giới hạn Plugin đáng tin cậy vào các target canonical `provider/model` cụ thể. Completion xuyên agent yêu cầu `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Khởi chạy và quản lý các lần chạy subagent nền.

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
      deliver: false,
    });

    // Wait for completion
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Read session messages
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Delete a session
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Ghi đè mô hình (`provider`/`model`) yêu cầu người vận hành chọn tham gia qua `plugins.entries.<id>.subagent.allowModelOverride: true` trong cấu hình. Plugin không đáng tin cậy vẫn có thể chạy subagent, nhưng các yêu cầu ghi đè sẽ bị từ chối.
    </Warning>

    `deleteSession(...)` có thể xóa các phiên do cùng Plugin tạo thông qua `api.runtime.subagent.run(...)`. Việc xóa tùy ý phiên của người dùng hoặc người vận hành vẫn yêu cầu một yêu cầu Gateway có phạm vi quản trị viên.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liệt kê các Node đã kết nối và gọi một lệnh node-host từ mã Plugin được Gateway tải hoặc từ các lệnh CLI của Plugin. Dùng mục này khi một Plugin sở hữu công việc cục bộ trên một thiết bị đã ghép đôi, ví dụ như trình duyệt hoặc cầu nối âm thanh trên một máy Mac khác.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Bên trong Gateway, runtime này chạy trong cùng tiến trình. Trong các lệnh CLI của Plugin, nó gọi Gateway đã cấu hình qua RPC, vì vậy các lệnh như `openclaw googlemeet recover-tab` có thể kiểm tra các Node đã ghép đôi từ terminal. Các lệnh Node vẫn đi qua quy trình ghép đôi Node bình thường của Gateway, danh sách lệnh được phép, chính sách node-invoke của Plugin và xử lý lệnh cục bộ trên Node.

    Các Plugin cung cấp lệnh node-host nguy hiểm nên đăng ký một chính sách node-invoke bằng `api.registerNodeInvokePolicy(...)`. Chính sách chạy trong Gateway sau bước kiểm tra danh sách lệnh được phép và trước khi lệnh được chuyển tiếp đến Node, vì vậy các lệnh gọi trực tiếp `node.invoke` và công cụ Plugin cấp cao hơn dùng chung cùng đường thực thi cưỡng chế.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Gắn một runtime luồng tác vụ vào khóa phiên OpenClaw hiện có hoặc ngữ cảnh công cụ đáng tin cậy, rồi tạo và quản lý các luồng tác vụ mà không cần truyền chủ sở hữu trong mọi lệnh gọi.

    Luồng tác vụ theo dõi trạng thái quy trình nhiều bước bền vững. Nó không phải là bộ lập lịch:
    dùng Cron hoặc `api.session.workflow.scheduleSessionTurn(...)` cho các lần
    đánh thức trong tương lai, rồi dùng `managedFlows` từ lượt đã lập lịch khi công việc đó
    cần trạng thái luồng, tác vụ con, chờ đợi hoặc hủy.

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

    Dùng `bindSession({ sessionKey, requesterOrigin })` khi bạn đã có khóa phiên OpenClaw đáng tin cậy từ lớp liên kết riêng của mình. Không liên kết từ dữ liệu nhập thô của người dùng.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Tổng hợp văn bản thành giọng nói.

    ```typescript
    // Standard TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telephony-optimized TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // List available voices
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Sử dụng cấu hình lõi `messages.tts` và lựa chọn provider. Trả về bộ đệm âm thanh PCM + tốc độ lấy mẫu.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Phân tích hình ảnh, âm thanh và video.

    ```typescript
    // Describe an image
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribe audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
    });

    // Describe a video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generic file analysis
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Structured image extraction through a specific provider/model.
    // Include at least one image; text inputs are supplemental context.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.5",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefer the printed total over handwritten notes." },
      ],
      instructions: "Extract vendor, total, and searchable tags.",
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

    Trả về `{ text: undefined }` khi không tạo ra đầu ra nào, ví dụ dữ liệu nhập bị bỏ qua.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` vẫn là bí danh tương thích cho `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Tạo hình ảnh.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Tìm kiếm trên web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Tiện ích phương tiện cấp thấp.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
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
    Ảnh chụp cấu hình runtime hiện tại và thao tác ghi cấu hình theo giao dịch. Ưu tiên
    cấu hình đã được truyền vào đường gọi đang hoạt động; chỉ dùng
    `current()` khi trình xử lý cần trực tiếp ảnh chụp tiến trình.

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
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Deprecated compatibility alias.
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runCommandWithTimeout(...)` trả về `stdout` và `stderr` đã thu thập, số lượng
    cắt ngắn tùy chọn, `code`, `signal`, `killed`, `termination` và
    `noOutputTimedOut`. Kết quả hết thời gian chờ và hết thời gian chờ do không có đầu ra báo cáo `code: 124`
    khi tiến trình con không cung cấp mã thoát khác không. Các lần thoát bằng tín hiệu
    không do hết thời gian chờ vẫn có thể trả về `code: null`, vì vậy hãy dùng `termination` và
    `noOutputTimedOut` để phân biệt lý do hết thời gian chờ.

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
    Ghi log.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Phân giải xác thực mô hình và provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Phân giải thư mục trạng thái và lưu trữ khóa dựa trên SQLite.

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
    await store.consume("key-1");
    await store.clear();
    ```

    Keyed store vẫn tồn tại sau khi khởi động lại và được cô lập theo id Plugin gắn với runtime. Dùng `registerIfAbsent(...)` cho các yêu cầu khử trùng lặp nguyên tử: hàm này trả về `true` khi key bị thiếu hoặc đã hết hạn và đã được đăng ký, hoặc `false` khi một giá trị còn hiệu lực đã tồn tại mà không ghi đè giá trị, thời gian tạo, hoặc TTL của nó. Giới hạn: `maxEntries` theo từng namespace, 6.000 hàng còn hiệu lực cho mỗi Plugin, giá trị JSON dưới 64KB, và tùy chọn hết hạn TTL. Khi một lần ghi sẽ vượt quá giới hạn hàng của Plugin, runtime có thể loại bỏ các hàng còn hiệu lực cũ nhất khỏi namespace đang được ghi; các namespace cùng cấp không bị loại bỏ cho lần ghi đó, và lần ghi vẫn thất bại nếu namespace không thể giải phóng đủ hàng.

    <Warning>
    Chỉ Plugin tích hợp sẵn trong bản phát hành này.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Factory công cụ bộ nhớ và CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Helper runtime dành riêng cho kênh (có sẵn khi một Plugin kênh được tải).

    `api.runtime.channel.media` là bề mặt được ưu tiên cho việc tải xuống và lưu trữ media của kênh:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Dùng `saveRemoteMedia(...)` khi một URL từ xa cần trở thành media của OpenClaw. Dùng `saveResponseMedia(...)` khi Plugin đã fetch một `Response` với xác thực, chuyển hướng, hoặc xử lý allowlist do Plugin sở hữu. Chỉ dùng `readRemoteMediaBuffer(...)` khi Plugin cần byte thô để kiểm tra, biến đổi, giải mã, hoặc tải lên lại. `fetchRemoteMedia(...)` vẫn là alias tương thích đã bị phản đối cho `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` là bề mặt chính sách đề cập đầu vào dùng chung cho các Plugin kênh tích hợp sẵn sử dụng injection runtime:

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

    Các helper đề cập có sẵn:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` cố ý không phơi bày các helper tương thích `resolveMentionGating*` cũ hơn. Ưu tiên đường dẫn đã chuẩn hóa `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Lưu trữ tham chiếu runtime

Dùng `createPluginRuntimeStore` để lưu tham chiếu runtime nhằm sử dụng bên ngoài callback `register`:

<Steps>
  <Step title="Tạo store">
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
Ưu tiên `pluginId` cho danh tính runtime-store. Dạng `key` cấp thấp hơn dành cho các trường hợp không phổ biến, khi một Plugin cố ý cần nhiều hơn một slot runtime.
</Note>

## Các trường `api` cấp cao khác

Ngoài `api.runtime`, đối tượng API cũng cung cấp:

<ParamField path="api.id" type="string">
  Id Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Tên hiển thị của Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot cấu hình hiện tại (snapshot runtime trong bộ nhớ đang hoạt động khi có sẵn).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Cấu hình dành riêng cho Plugin từ `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger theo phạm vi (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước điểm vào đầy đủ.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Phân giải một đường dẫn tương đối với root của Plugin.
</ParamField>

## Liên quan

- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình capability và registry
- [Điểm vào SDK](/vi/plugins/sdk-entrypoints) — tùy chọn `definePluginEntry`
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu subpath
