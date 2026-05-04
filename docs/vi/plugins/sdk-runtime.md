---
read_when:
    - Bạn cần gọi các helper cốt lõi từ một Plugin (TTS, STT, tạo hình ảnh, tìm kiếm web, subagent, Node)
    - Bạn muốn hiểu api.runtime cung cấp những gì
    - Bạn đang truy cập các hàm trợ giúp về cấu hình, tác tử hoặc phương tiện từ mã Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- các trình trợ giúp thời gian chạy được chèn có sẵn cho các Plugin
title: Các hàm trợ giúp thời gian chạy của Plugin
x-i18n:
    generated_at: "2026-05-04T09:37:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c968f30052ecba4359bdaa9b1c640c1220268933ce01ccef06bcade225b50b7d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Tham chiếu cho đối tượng `api.runtime` được chèn vào mọi plugin trong quá trình đăng ký. Dùng các helper này thay vì nhập trực tiếp các thành phần nội bộ của host.

<CardGroup cols={2}>
  <Card title="Plugin kênh" href="/vi/plugins/sdk-channel-plugins">
    Hướng dẫn từng bước sử dụng các helper này trong ngữ cảnh cho Plugin kênh.
  </Card>
  <Card title="Plugin nhà cung cấp" href="/vi/plugins/sdk-provider-plugins">
    Hướng dẫn từng bước sử dụng các helper này trong ngữ cảnh cho Plugin nhà cung cấp.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Tải và ghi cấu hình

Ưu tiên cấu hình đã được truyền vào đường dẫn lệnh gọi đang hoạt động, ví dụ `api.config` trong quá trình đăng ký hoặc một đối số `cfg` trên các callback của kênh/nhà cung cấp. Điều này giữ cho một snapshot tiến trình duy nhất đi xuyên suốt công việc thay vì phân tích lại cấu hình trên các đường dẫn nóng.

Chỉ dùng `api.runtime.config.current()` khi một handler tồn tại lâu cần snapshot tiến trình hiện tại và không có cấu hình nào được truyền vào hàm đó. Giá trị trả về là chỉ đọc; hãy sao chép hoặc dùng helper đột biến trước khi chỉnh sửa.

Các factory công cụ nhận `ctx.runtimeConfig` cùng với `ctx.getRuntimeConfig()`. Dùng getter bên trong callback `execute` của một công cụ tồn tại lâu khi cấu hình có thể thay đổi sau khi định nghĩa công cụ đã được tạo.

Lưu thay đổi bằng `api.runtime.config.mutateConfigFile(...)` hoặc `api.runtime.config.replaceConfigFile(...)`. Mỗi lần ghi phải chọn một chính sách `afterWrite` rõ ràng:

- `afterWrite: { mode: "auto" }` để bộ quyết định tải lại của Gateway xử lý.
- `afterWrite: { mode: "restart", reason: "..." }` buộc khởi động lại sạch khi trình ghi biết rằng tải lại nóng không an toàn.
- `afterWrite: { mode: "none", reason: "..." }` chỉ chặn tự động tải lại/khởi động lại khi bên gọi sở hữu bước tiếp theo.

Các helper đột biến trả về `afterWrite` cùng với bản tóm tắt `followUp` có kiểu để bên gọi có thể ghi log hoặc kiểm thử xem họ đã yêu cầu khởi động lại hay chưa. Gateway vẫn sở hữu thời điểm việc khởi động lại đó thực sự diễn ra.

`api.runtime.config.loadConfig()` và `api.runtime.config.writeConfigFile(...)` là các helper tương thích đã bị loại bỏ dần dưới `runtime-config-load-write`. Chúng cảnh báo một lần khi chạy và vẫn có sẵn cho các plugin bên ngoài cũ trong giai đoạn chuyển đổi. Các plugin đi kèm không được dùng chúng; các bộ bảo vệ ranh giới cấu hình sẽ thất bại nếu mã plugin gọi chúng hoặc nhập các helper đó từ các đường dẫn con của SDK plugin.

Với các import SDK trực tiếp, hãy dùng các đường dẫn con cấu hình tập trung thay vì barrel tương thích rộng
`openclaw/plugin-sdk/config-runtime`: `config-types` cho
kiểu, `plugin-config-runtime` cho các xác nhận cấu hình đã tải và tra cứu mục
plugin, `runtime-config-snapshot` cho snapshot tiến trình hiện tại, và
`config-mutation` cho thao tác ghi. Kiểm thử plugin đi kèm nên mock trực tiếp các
đường dẫn con tập trung này thay vì mock barrel tương thích rộng.

Mã runtime nội bộ của OpenClaw đi theo cùng hướng: tải cấu hình một lần tại ranh giới CLI, Gateway hoặc tiến trình, rồi truyền giá trị đó xuyên suốt. Các lần ghi đột biến thành công sẽ làm mới snapshot runtime của tiến trình và tăng revision nội bộ của nó; các cache tồn tại lâu nên dùng cache key do runtime sở hữu thay vì tự tuần tự hóa cấu hình cục bộ. Các module runtime tồn tại lâu có bộ quét không khoan nhượng đối với các lệnh gọi `loadConfig()` môi trường xung quanh; hãy dùng `cfg` được truyền vào, `context.getRuntimeConfig()` của request, hoặc `getRuntimeConfig()` tại một ranh giới tiến trình rõ ràng.

Các đường dẫn thực thi nhà cung cấp và kênh phải dùng snapshot cấu hình runtime đang hoạt động, không phải snapshot tệp được trả về để đọc lại hoặc chỉnh sửa cấu hình. Snapshot tệp giữ nguyên các giá trị nguồn như marker SecretRef cho UI và thao tác ghi; callback nhà cung cấp cần góc nhìn runtime đã được phân giải. Khi một helper có thể được gọi bằng snapshot nguồn đang hoạt động hoặc snapshot runtime đang hoạt động, hãy đi qua `selectApplicableRuntimeConfig()` trước khi đọc thông tin xác thực.

## Không gian tên runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Danh tính tác tử, thư mục và quản lý phiên.

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

    `runEmbeddedAgent(...)` là helper trung lập để bắt đầu một lượt tác tử OpenClaw bình thường từ mã plugin. Nó dùng cùng cơ chế phân giải nhà cung cấp/mô hình và chọn agent-harness như các phản hồi được kích hoạt từ kênh.

    `runEmbeddedPiAgent(...)` vẫn là alias tương thích.

    `resolveThinkingPolicy(...)` trả về các mức suy nghĩ được hỗ trợ của nhà cung cấp/mô hình và giá trị mặc định tùy chọn. Plugin nhà cung cấp sở hữu hồ sơ theo mô hình thông qua các hook suy nghĩ của chúng, nên plugin công cụ nên gọi helper runtime này thay vì import hoặc nhân bản danh sách nhà cung cấp.

    `normalizeThinkingLevel(...)` chuyển văn bản người dùng như `on`, `x-high`, hoặc `extra high` thành mức lưu trữ chuẩn trước khi kiểm tra nó với chính sách đã phân giải.

    **Các helper kho phiên** nằm trong `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Ưu tiên `updateSessionStore(...)` hoặc `updateSessionStoreEntry(...)` cho các thao tác ghi runtime. Chúng đi qua trình ghi kho phiên do Gateway sở hữu, giữ lại các cập nhật đồng thời và tái sử dụng cache nóng. `saveSessionStore(...)` vẫn có sẵn cho tương thích và các lần ghi lại kiểu bảo trì ngoại tuyến.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Hằng số mô hình và nhà cung cấp mặc định:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Khởi chạy và quản lý các lượt chạy subagent nền.

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
    Ghi đè mô hình (`provider`/`model`) yêu cầu operator chọn tham gia thông qua `plugins.entries.<id>.subagent.allowModelOverride: true` trong cấu hình. Plugin không tin cậy vẫn có thể chạy subagent, nhưng các yêu cầu ghi đè sẽ bị từ chối.
    </Warning>

    `deleteSession(...)` có thể xóa các phiên được tạo bởi cùng plugin thông qua `api.runtime.subagent.run(...)`. Việc xóa phiên người dùng hoặc operator tùy ý vẫn yêu cầu request Gateway trong phạm vi admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liệt kê các node đã kết nối và gọi một lệnh node-host từ mã plugin được Gateway tải hoặc từ các lệnh CLI của plugin. Dùng phần này khi một plugin sở hữu công việc cục bộ trên thiết bị đã ghép đôi, ví dụ cầu nối trình duyệt hoặc âm thanh trên một máy Mac khác.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Bên trong Gateway, runtime này chạy trong cùng tiến trình. Trong các lệnh CLI plugin, nó gọi Gateway đã cấu hình qua RPC, nên các lệnh như `openclaw googlemeet recover-tab` có thể kiểm tra các node đã ghép đôi từ terminal. Các lệnh node vẫn đi qua quy trình ghép đôi node Gateway thông thường, danh sách cho phép lệnh, chính sách node-invoke của plugin và xử lý lệnh cục bộ trên node.

    Các plugin phơi bày lệnh node-host nguy hiểm nên đăng ký chính sách node-invoke với `api.registerNodeInvokePolicy(...)`. Chính sách chạy trong Gateway sau các bước kiểm tra danh sách cho phép lệnh và trước khi lệnh được chuyển tiếp đến node, vì vậy các lệnh gọi `node.invoke` trực tiếp và công cụ plugin cấp cao hơn dùng chung cùng đường dẫn thực thi.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Liên kết runtime luồng tác vụ với một khóa phiên OpenClaw hiện có hoặc ngữ cảnh công cụ đáng tin cậy, rồi tạo và quản lý các luồng tác vụ mà không cần truyền owner trong mọi lệnh gọi.

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

    Dùng `bindSession({ sessionKey, requesterOrigin })` khi bạn đã có khóa phiên OpenClaw đáng tin cậy từ lớp liên kết của riêng mình. Không liên kết từ đầu vào thô của người dùng.

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

    Dùng cấu hình lõi `messages.tts` và lựa chọn nhà cung cấp. Trả về bộ đệm âm thanh PCM + tốc độ mẫu.

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

    Trả về `{ text: undefined }` khi không tạo ra đầu ra nào (ví dụ: đầu vào bị bỏ qua).

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
    Ảnh chụp cấu hình runtime hiện tại và thao tác ghi cấu hình theo giao dịch. Ưu tiên
    cấu hình đã được truyền vào đường dẫn lệnh gọi đang hoạt động; chỉ dùng
    `current()` khi handler cần trực tiếp ảnh chụp của tiến trình.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` và `replaceConfigFile(...)` trả về một giá trị
    `followUp`, ví dụ `{ mode: "restart", requiresRestart: true, reason }`,
    ghi lại ý định của bên ghi mà không lấy quyền điều khiển khởi động lại khỏi
    gateway.

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
    Đăng ký theo dõi sự kiện.

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
    Phân giải thư mục trạng thái và kho lưu trữ theo khóa dựa trên SQLite.

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

    Kho lưu trữ theo khóa tồn tại qua các lần khởi động lại và được cô lập theo id Plugin gắn với runtime. Dùng `registerIfAbsent(...)` cho các yêu cầu khử trùng lặp nguyên tử: hàm trả về `true` khi khóa bị thiếu hoặc đã hết hạn và được đăng ký, hoặc `false` khi một giá trị còn hiệu lực đã tồn tại mà không ghi đè giá trị, thời điểm tạo hoặc TTL của nó. Giới hạn: `maxEntries` trên mỗi namespace, 1.000 hàng còn hiệu lực trên mỗi Plugin, giá trị JSON dưới 64KB và tùy chọn hết hạn TTL.

    <Warning>
    Chỉ dành cho các Plugin được đóng gói trong bản phát hành này.
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
    Helper runtime dành riêng cho kênh (khả dụng khi một Plugin kênh được tải).

    `api.runtime.channel.mentions` là bề mặt chính sách nhắc đến đầu vào dùng chung cho các Plugin kênh được đóng gói có dùng chèn runtime:

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

    Các helper nhắc đến có sẵn:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` cố ý không để lộ các helper tương thích `resolveMentionGating*` cũ hơn. Ưu tiên đường dẫn chuẩn hóa `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Lưu trữ tham chiếu runtime

Dùng `createPluginRuntimeStore` để lưu tham chiếu runtime nhằm sử dụng bên ngoài callback `register`:

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
Ưu tiên `pluginId` cho định danh runtime-store. Dạng `key` cấp thấp hơn dành cho các trường hợp ít gặp khi một Plugin cố ý cần nhiều hơn một slot runtime.
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
  Ảnh chụp cấu hình hiện tại (ảnh chụp runtime trong bộ nhớ đang hoạt động khi có sẵn).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Cấu hình dành riêng cho Plugin từ `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger theo phạm vi (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Chế độ tải hiện tại; `"setup-runtime"` là cửa sổ khởi động/thiết lập nhẹ trước full-entry.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Phân giải một đường dẫn tương đối với gốc Plugin.
</ParamField>

## Liên quan

- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình năng lực và registry
- [Điểm vào SDK](/vi/plugins/sdk-entrypoints) — tùy chọn `definePluginEntry`
- [Tổng quan SDK](/vi/plugins/sdk-overview) — tham chiếu subpath
