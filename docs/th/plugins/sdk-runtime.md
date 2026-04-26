---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยของแกนหลักจาก Plugin (TTS, STT, การสร้างภาพ การค้นหาเว็บ subagent, Node)
    - คุณต้องการทำความเข้าใจว่า `api.runtime` เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้าน config, agent หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: '`api.runtime` -- ตัวช่วยรันไทม์ที่ถูก inject และพร้อมใช้งานสำหรับ Plugin'
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-04-26T11:38:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

เอกสารอ้างอิงสำหรับอ็อบเจ็กต์ `api.runtime` ที่ถูก inject เข้าไปในทุก Plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการ import ส่วนภายในของโฮสต์โดยตรง

<CardGroup cols={2}>
  <Card title="Plugin ของแชนเนล" href="/th/plugins/sdk-channel-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทของ Plugin แชนเนล
  </Card>
  <Card title="Plugin ของผู้ให้บริการ" href="/th/plugins/sdk-provider-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทของ Plugin ผู้ให้บริการ
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## เนมสเปซของรันไทม์

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    อัตลักษณ์ของ agent ไดเรกทอรี และการจัดการเซสชัน

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

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

    `runEmbeddedAgent(...)` คือตัวช่วยแบบเป็นกลางสำหรับเริ่มรอบการทำงานของ agent OpenClaw ปกติจากโค้ด Plugin โดยใช้การ resolve ผู้ให้บริการ/โมเดล และการเลือก agent-harness แบบเดียวกับการตอบกลับที่ถูกทริกเกอร์จากแชนเนล

    `runEmbeddedPiAgent(...)` ยังคงมีอยู่ในฐานะชื่อแทนเพื่อความเข้ากันได้

    **ตัวช่วย session store** อยู่ภายใต้ `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่ของโมเดลและผู้ให้บริการเริ่มต้น:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    เรียกใช้งานและจัดการการรัน subagent เบื้องหลัง

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
    การ override โมเดล (`provider`/`model`) ต้องได้รับการยินยอมจากผู้ดูแลระบบผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ใน config ก่อน Plugin ที่ไม่น่าเชื่อถือยังคงรัน subagent ได้ แต่คำขอ override จะถูกปฏิเสธ
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการ Node ที่เชื่อมต่ออยู่ และเรียกคำสั่งที่โฮสต์บน Node จากโค้ด Plugin ที่ถูกโหลดโดย Gateway หรือจากคำสั่ง CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงานภายในเครื่องบนอุปกรณ์ที่จับคู่ไว้ เช่น เบราว์เซอร์หรือ audio bridge บน Mac อีกเครื่อง

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway รันไทม์นี้ทำงานในโปรเซสเดียวกัน ในคำสั่ง CLI ของ Plugin มันจะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งอย่าง `openclaw googlemeet recover-tab` จึงสามารถตรวจสอบ Node ที่จับคู่ไว้จากเทอร์มินัลได้ คำสั่งของ Node ยังคงผ่านการจับคู่ Node ของ Gateway ตามปกติ allowlist ของคำสั่ง และการจัดการคำสั่งภายในเครื่องของ Node

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    ผูก TaskFlow runtime เข้ากับ session key ของ OpenClaw ที่มีอยู่ หรือบริบท tool ที่เชื่อถือได้ จากนั้นสร้างและจัดการ TaskFlow โดยไม่ต้องส่ง owner ทุกครั้งที่เรียก

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมี session key ของ OpenClaw ที่เชื่อถือได้อยู่แล้วจากชั้นการผูกของคุณเอง อย่าผูกจากอินพุตผู้ใช้ดิบ

  </Accordion>
  <Accordion title="api.runtime.tts">
    การสังเคราะห์ข้อความเป็นเสียงพูด

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

    ใช้การกำหนดค่า `messages.tts` และการเลือกผู้ให้บริการของแกนหลัก ส่งกลับบัฟเฟอร์เสียง PCM + sample rate

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    การวิเคราะห์ภาพ เสียง และวิดีโอ

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

    ส่งกลับ `{ text: undefined }` เมื่อไม่มีเอาต์พุตที่ถูกสร้างขึ้น (เช่น อินพุตถูกข้าม)

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` ยังคงมีอยู่ในฐานะชื่อแทนเพื่อความเข้ากันได้ของ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    การสร้างภาพ

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    การค้นหาเว็บ

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    ยูทิลิตีสื่อระดับต่ำ

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
    การโหลดและเขียน config

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    ยูทิลิตีระดับระบบ

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    การสมัครรับเหตุการณ์

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
    การบันทึกล็อก

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    การ resolve การยืนยันตัวตนของโมเดลและผู้ให้บริการ

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    การ resolve ไดเรกทอรีสถานะ

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

  </Accordion>
  <Accordion title="api.runtime.tools">
    factory ของ memory tool และ CLI

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    ตัวช่วยรันไทม์เฉพาะแชนเนล (พร้อมใช้งานเมื่อมีการโหลด Plugin ของแชนเนล)

    `api.runtime.channel.mentions` คือ surface นโยบาย mention ขาเข้าแบบใช้ร่วมกันสำหรับ Plugin แชนเนลแบบ bundled ที่ใช้ runtime injection:

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

    ตัวช่วย mention ที่พร้อมใช้งาน:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` จงใจไม่เปิดเผยตัวช่วยเพื่อความเข้ากันได้แบบเก่า `resolveMentionGating*` ควรใช้เส้นทาง `{ facts, policy }` แบบทำให้เป็นมาตรฐานแทน

  </Accordion>
</AccordionGroup>

## การจัดเก็บการอ้างอิงรันไทม์

ใช้ `createPluginRuntimeStore` เพื่อจัดเก็บการอ้างอิงรันไทม์สำหรับใช้นอก callback `register`:

<Steps>
  <Step title="สร้าง store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="เชื่อมเข้ากับ entry point">
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
  <Step title="เข้าถึงจากไฟล์อื่น">
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
ควรใช้ `pluginId` สำหรับอัตลักษณ์ของ runtime-store รูปแบบ `key` ระดับล่างมีไว้สำหรับกรณีที่ไม่พบบ่อย ซึ่ง Plugin หนึ่งตัวตั้งใจต้องการสล็อตรันไทม์มากกว่าหนึ่งสล็อต
</Note>

## ฟิลด์ `api` ระดับบนอื่น ๆ

นอกเหนือจาก `api.runtime` แล้ว อ็อบเจ็กต์ API ยังมีสิ่งต่อไปนี้ด้วย:

<ParamField path="api.id" type="string">
  id ของ Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่ใช้แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  snapshot config ปัจจุบัน (snapshot รันไทม์ในหน่วยความจำที่ใช้งานอยู่ หากมี)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  config เฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger แบบมีขอบเขต (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่างเริ่มต้น/ตั้งค่าก่อน entry แบบเต็มในรูปแบบเบา
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  resolve path โดยอิงจาก root ของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [รายละเอียดภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและรีจิสทรี
- [SDK entry points](/th/plugins/sdk-entrypoints) — ตัวเลือกของ `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — เอกสารอ้างอิง subpath
