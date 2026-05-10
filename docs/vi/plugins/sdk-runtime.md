---
read_when:
    - Bạn cần gọi các hàm trợ giúp lõi từ một Plugin (TTS, STT, tạo ảnh, tìm kiếm web, tác tử phụ, nút)
    - Bạn muốn hiểu api.runtime cung cấp những gì
    - Bạn đang truy cập các trình trợ giúp về cấu hình, tác tử hoặc phương tiện từ mã Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- các trình trợ giúp thời gian chạy được chèn sẵn mà Plugin có thể sử dụng
title: Các hàm trợ giúp thời gian chạy của Plugin
x-i18n:
    generated_at: "2026-05-10T19:46:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7771eb89c8ce132cc3c908b3775a89243db310d3d3222452b21ec070a78cd23d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Tài liệu tham chiếu cho đối tượng `api.runtime` được tiêm vào mọi plugin trong quá trình đăng ký. Hãy dùng các hàm trợ giúp này thay vì nhập trực tiếp các phần nội bộ của tiến trình chủ.

<CardGroup cols={2}>
  <Card title="Plugin kênh" href="/vi/plugins/sdk-channel-plugins">
    Hướng dẫn từng bước sử dụng các hàm trợ giúp này trong ngữ cảnh cho plugin kênh.
  </Card>
  <Card title="Plugin nhà cung cấp" href="/vi/plugins/sdk-provider-plugins">
    Hướng dẫn từng bước sử dụng các hàm trợ giúp này trong ngữ cảnh cho plugin nhà cung cấp.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Tải và ghi cấu hình

Ưu tiên cấu hình đã được truyền vào đường dẫn gọi đang hoạt động, ví dụ `api.config` trong quá trình đăng ký hoặc đối số `cfg` trong các callback của kênh/nhà cung cấp. Điều này giữ cho một ảnh chụp nhanh tiến trình duy nhất luân chuyển xuyên suốt công việc thay vì phân tích lại cấu hình trên các đường dẫn nóng.

Chỉ dùng `api.runtime.config.current()` khi một handler tồn tại lâu cần ảnh chụp nhanh tiến trình hiện tại và không có cấu hình nào được truyền vào hàm đó. Giá trị được trả về là chỉ đọc; hãy clone hoặc dùng một hàm trợ giúp đột biến trước khi chỉnh sửa.

Các factory công cụ nhận `ctx.runtimeConfig` cùng với `ctx.getRuntimeConfig()`. Hãy dùng getter bên trong callback `execute` của một công cụ tồn tại lâu khi cấu hình có thể thay đổi sau khi định nghĩa công cụ đã được tạo.

Lưu các thay đổi bằng `api.runtime.config.mutateConfigFile(...)` hoặc `api.runtime.config.replaceConfigFile(...)`. Mỗi lần ghi phải chọn một chính sách `afterWrite` rõ ràng:

- `afterWrite: { mode: "auto" }` để trình quyết định tải lại Gateway quyết định.
- `afterWrite: { mode: "restart", reason: "..." }` buộc khởi động lại sạch khi bên ghi biết rằng tải lại nóng không an toàn.
- `afterWrite: { mode: "none", reason: "..." }` chỉ chặn tải lại/khởi động lại tự động khi bên gọi sở hữu bước tiếp theo.

Các hàm trợ giúp đột biến trả về `afterWrite` cùng với một bản tóm tắt `followUp` có kiểu để bên gọi có thể ghi log hoặc kiểm thử xem họ đã yêu cầu khởi động lại hay chưa. Gateway vẫn sở hữu thời điểm việc khởi động lại đó thực sự xảy ra.

`api.runtime.config.loadConfig()` và `api.runtime.config.writeConfigFile(...)` là các hàm trợ giúp tương thích đã lỗi thời trong `runtime-config-load-write`. Chúng cảnh báo một lần tại runtime và vẫn có sẵn cho các plugin bên ngoài cũ trong giai đoạn chuyển đổi. Các plugin được đóng gói sẵn không được dùng chúng; các guard ranh giới cấu hình sẽ thất bại nếu mã plugin gọi chúng hoặc nhập các hàm trợ giúp đó từ các đường dẫn con của SDK plugin.

Đối với các lần nhập SDK trực tiếp, hãy dùng các đường dẫn con cấu hình tập trung thay vì barrel tương thích rộng
`openclaw/plugin-sdk/config-runtime`: `config-contracts` cho
kiểu, `plugin-config-runtime` cho các assertion cấu hình đã tải sẵn và tra cứu điểm vào plugin,
`runtime-config-snapshot` cho ảnh chụp nhanh tiến trình hiện tại, và
`config-mutation` cho ghi. Các kiểm thử plugin được đóng gói sẵn nên mock trực tiếp các
đường dẫn con tập trung này thay vì mock barrel tương thích rộng.

Mã runtime nội bộ của OpenClaw cũng đi theo cùng hướng: tải cấu hình một lần tại ranh giới CLI, Gateway, hoặc tiến trình, rồi truyền giá trị đó xuyên suốt. Các lần ghi đột biến thành công làm mới ảnh chụp nhanh runtime của tiến trình và tăng revision nội bộ của nó; các cache tồn tại lâu nên khóa theo khóa cache do runtime sở hữu thay vì serialize cấu hình cục bộ. Các module runtime tồn tại lâu có bộ quét không khoan nhượng đối với các lệnh gọi `loadConfig()` môi trường; hãy dùng `cfg` được truyền vào, `context.getRuntimeConfig()` của request, hoặc `getRuntimeConfig()` tại một ranh giới tiến trình rõ ràng.

Các đường dẫn thực thi nhà cung cấp và kênh phải dùng ảnh chụp nhanh cấu hình runtime đang hoạt động, không phải ảnh chụp nhanh tệp được trả về để đọc lại hoặc chỉnh sửa cấu hình. Ảnh chụp nhanh tệp giữ nguyên các giá trị nguồn như marker SecretRef cho giao diện người dùng và các lần ghi; callback nhà cung cấp cần chế độ xem runtime đã được phân giải. Khi một hàm trợ giúp có thể được gọi với ảnh chụp nhanh nguồn đang hoạt động hoặc ảnh chụp nhanh runtime đang hoạt động, hãy định tuyến qua `selectApplicableRuntimeConfig()` trước khi đọc thông tin xác thực.

## Không gian tên runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Danh tính agent, thư mục, và quản lý phiên.

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
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` là hàm trợ giúp trung lập để bắt đầu một lượt agent OpenClaw bình thường từ mã plugin. Hàm này dùng cùng cơ chế phân giải nhà cung cấp/mô hình và lựa chọn harness agent như các phản hồi được kích hoạt bởi kênh.

    `runEmbeddedPiAgent(...)` vẫn là alias tương thích.

    `resolveThinkingPolicy(...)` trả về các mức suy nghĩ được hỗ trợ của nhà cung cấp/mô hình và giá trị mặc định tùy chọn. Plugin nhà cung cấp sở hữu hồ sơ riêng theo mô hình thông qua các hook suy nghĩ của chúng, vì vậy plugin công cụ nên gọi hàm trợ giúp runtime này thay vì nhập hoặc sao chép danh sách nhà cung cấp.

    `normalizeThinkingLevel(...)` chuyển đổi văn bản người dùng như `on`, `x-high`, hoặc `extra high` thành mức lưu trữ chuẩn trước khi kiểm tra mức đó với chính sách đã phân giải.

    **Các hàm trợ giúp kho phiên** nằm dưới `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Ưu tiên `updateSessionStore(...)` hoặc `updateSessionStoreEntry(...)` cho các lần ghi runtime. Chúng định tuyến qua trình ghi kho phiên do Gateway sở hữu, giữ nguyên các cập nhật đồng thời, và tái sử dụng cache nóng. `saveSessionStore(...)` vẫn có sẵn để tương thích và cho các lần ghi lại kiểu bảo trì ngoại tuyến.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Hằng số mô hình và nhà cung cấp mặc định:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Chạy một text completion do tiến trình chủ sở hữu mà không nhập phần nội bộ của nhà cung cấp hoặc
    sao chép bước chuẩn bị mô hình/auth/base URL của OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Hàm trợ giúp này dùng cùng đường dẫn chuẩn bị completion đơn giản như runtime
    tích hợp sẵn của OpenClaw và ảnh chụp nhanh cấu hình runtime do tiến trình chủ sở hữu. Các engine ngữ cảnh
    nhận capability `llm.complete` được ràng buộc với phiên, vì vậy các lệnh gọi mô hình dùng agent
    của phiên đang hoạt động và không âm thầm fallback về agent mặc định. Kết quả
    bao gồm quy thuộc nhà cung cấp/mô hình/agent cùng với token,
    cache, và mức dùng chi phí ước tính đã chuẩn hóa khi có sẵn.

    <Warning>
    Ghi đè mô hình yêu cầu operator chọn tham gia qua `plugins.entries.<id>.llm.allowModelOverride: true` trong cấu hình. Dùng `plugins.entries.<id>.llm.allowedModels` để giới hạn các plugin đáng tin cậy vào các đích `provider/model` chuẩn cụ thể. Completion xuyên agent yêu cầu `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
    Ghi đè mô hình (`provider`/`model`) yêu cầu operator chọn tham gia qua `plugins.entries.<id>.subagent.allowModelOverride: true` trong cấu hình. Các plugin không đáng tin cậy vẫn có thể chạy subagent, nhưng các yêu cầu ghi đè sẽ bị từ chối.
    </Warning>

    `deleteSession(...)` có thể xóa các phiên được tạo bởi cùng plugin thông qua `api.runtime.subagent.run(...)`. Xóa các phiên tùy ý của người dùng hoặc operator vẫn yêu cầu một request Gateway có phạm vi admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liệt kê các node đã kết nối và gọi một lệnh trên node-host từ mã plugin được Gateway tải hoặc từ các lệnh CLI của plugin. Dùng mục này khi một plugin sở hữu công việc cục bộ trên thiết bị đã ghép đôi, ví dụ cầu nối trình duyệt hoặc âm thanh trên một máy Mac khác.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Bên trong Gateway, runtime này chạy trong cùng tiến trình. Trong các lệnh CLI của plugin, nó gọi Gateway đã cấu hình qua RPC, vì vậy các lệnh như `openclaw googlemeet recover-tab` có thể kiểm tra các node đã ghép đôi từ terminal. Các lệnh node vẫn đi qua cơ chế ghép đôi node thông thường của Gateway, allowlist lệnh, chính sách node-invoke của plugin, và xử lý lệnh cục bộ trên node.

    Các plugin expose lệnh node-host nguy hiểm nên đăng ký một chính sách node-invoke bằng `api.registerNodeInvokePolicy(...)`. Chính sách này chạy trong Gateway sau các bước kiểm tra allowlist lệnh và trước khi lệnh được chuyển tiếp đến node, vì vậy các lệnh gọi `node.invoke` trực tiếp và các công cụ plugin cấp cao hơn chia sẻ cùng một đường dẫn thực thi chính sách.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Ràng buộc runtime Task Flow với một khóa phiên OpenClaw hiện có hoặc ngữ cảnh công cụ đáng tin cậy, rồi tạo và quản lý Task Flow mà không cần truyền owner trong mọi lệnh gọi.

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

    Sử dụng `bindSession({ sessionKey, requesterOrigin })` khi bạn đã có khóa phiên OpenClaw đáng tin cậy từ lớp liên kết riêng của mình. Không liên kết từ dữ liệu nhập thô của người dùng.

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

    Sử dụng cấu hình `messages.tts` cốt lõi và lựa chọn nhà cung cấp. Trả về bộ đệm âm thanh PCM + tốc độ lấy mẫu.

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
    ```

    Trả về `{ text: undefined }` khi không có đầu ra nào được tạo ra (ví dụ: dữ liệu nhập bị bỏ qua).

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
    Tìm kiếm web.

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
    Ảnh chụp cấu hình runtime hiện tại và các lần ghi cấu hình theo giao dịch. Ưu tiên
    cấu hình đã được truyền vào đường dẫn lệnh gọi đang hoạt động; chỉ sử dụng
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
    ghi lại ý định của bộ ghi mà không lấy quyền kiểm soát khởi động lại khỏi
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
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Phân giải thư mục trạng thái và bộ lưu trữ khóa-giá trị dựa trên SQLite.

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

    Các kho khóa-giá trị tồn tại qua các lần khởi động lại và được cô lập theo ID Plugin gắn với runtime. Sử dụng `registerIfAbsent(...)` cho các yêu cầu khử trùng lặp nguyên tử: nó trả về `true` khi khóa bị thiếu hoặc đã hết hạn và được đăng ký, hoặc `false` khi một giá trị còn hiệu lực đã tồn tại mà không ghi đè giá trị, thời gian tạo hoặc TTL của giá trị đó. Giới hạn: `maxEntries` cho mỗi namespace, 1.000 hàng còn hiệu lực cho mỗi Plugin, giá trị JSON dưới 64KB và tùy chọn hết hạn TTL.

    <Warning>
    Chỉ các Plugin đi kèm trong bản phát hành này.
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
    Trình trợ giúp runtime dành riêng cho kênh (khả dụng khi một Plugin kênh được tải).

    `api.runtime.channel.mentions` là bề mặt chính sách nhắc đến đầu vào dùng chung cho các Plugin kênh đi kèm sử dụng tiêm runtime:

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

    Các trình trợ giúp nhắc đến có sẵn:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` cố ý không hiển thị các trình trợ giúp tương thích `resolveMentionGating*` cũ hơn. Ưu tiên đường dẫn `{ facts, policy }` đã chuẩn hóa.

  </Accordion>
</AccordionGroup>

## Lưu trữ tham chiếu runtime

Sử dụng `createPluginRuntimeStore` để lưu trữ tham chiếu runtime nhằm sử dụng bên ngoài callback `register`:

<Steps>
  <Step title="Create the store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Wire into the entry point">
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
  <Step title="Access from other files">
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
Ưu tiên `pluginId` cho định danh runtime-store. Dạng `key` cấp thấp hơn dành cho các trường hợp không phổ biến khi một Plugin cố ý cần nhiều hơn một vị trí runtime.
</Note>

## Các trường `api` cấp cao khác

Ngoài `api.runtime`, đối tượng API cũng cung cấp:

<ParamField path="api.id" type="string">
  ID Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Tên hiển thị của Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Ảnh chụp cấu hình hiện tại (ảnh chụp runtime trong bộ nhớ đang hoạt động khi có sẵn).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Cấu hình dành riêng cho Plugin từ `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger theo phạm vi (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước mục nhập đầy đủ.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Phân giải đường dẫn tương đối với gốc Plugin.
</ParamField>

## Liên quan

- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình capability và registry
- [Điểm vào SDK](/vi/plugins/sdk-entrypoints) — tùy chọn `definePluginEntry`
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu subpath
