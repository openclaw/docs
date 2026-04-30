---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างรูปภาพ, การค้นหาเว็บ, ตัวแทนย่อย, โหนด)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไรไว้
    - คุณกำลังเข้าถึงตัวช่วยด้านการกำหนดค่า เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูกแทรกให้สำหรับ Plugin ใช้งาน
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-04-30T10:08:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2264090e062be9892a2bac7d313cad80a550f79b0bf0d74635bf6b80aea5060
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับออบเจ็กต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุก plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการนำเข้า internals ของโฮสต์โดยตรง

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/th/plugins/sdk-channel-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ channel plugins
  </Card>
  <Card title="Provider plugins" href="/th/plugins/sdk-provider-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ provider plugins
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## การโหลดและการเขียน Config

ควรใช้ config ที่ถูกส่งเข้ามาในเส้นทางการเรียกที่กำลังทำงานอยู่แล้ว เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` ใน callback ของ channel/provider วิธีนี้ทำให้ snapshot ของ process เดียวไหลผ่านงาน แทนที่จะ parse config ซ้ำใน hot path

ใช้ `api.runtime.config.current()` เฉพาะเมื่อ handler ที่มีอายุยาวต้องการ snapshot ของ process ปัจจุบัน และไม่มี config ถูกส่งไปยังฟังก์ชันนั้น ค่าที่คืนมาเป็น readonly ให้ clone หรือใช้ตัวช่วย mutation ก่อนแก้ไข

Tool factories จะได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายใน callback `execute` ของ tool ที่มีอายุยาวเมื่อ config อาจเปลี่ยนหลังจากสร้าง definition ของ tool แล้ว

บันทึกการเปลี่ยนแปลงด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` ที่ชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินการ reload ของ gateway เป็นผู้ตัดสินใจ
- `afterWrite: { mode: "restart", reason: "..." }` บังคับให้ restart แบบสะอาดเมื่อ writer รู้ว่า hot reload ไม่ปลอดภัย
- `afterWrite: { mode: "none", reason: "..." }` ระงับการ reload/restart อัตโนมัติเฉพาะเมื่อ caller เป็นเจ้าของขั้นตอนติดตามผล

ตัวช่วย mutation จะคืนค่า `afterWrite` พร้อมสรุป `followUp` ที่มี type เพื่อให้ caller สามารถ log หรือทดสอบได้ว่าได้ขอ restart หรือไม่ Gateway ยังคงเป็นเจ้าของว่า restart นั้นจะเกิดขึ้นจริงเมื่อใด

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็นตัวช่วย compatibility ที่เลิกแนะนำให้ใช้แล้วภายใต้ `runtime-config-load-write` ตัวช่วยเหล่านี้เตือนหนึ่งครั้งที่ runtime และยังคงพร้อมใช้งานสำหรับ plugins ภายนอกเก่าระหว่างช่วง migration bundled plugins ต้องไม่ใช้ตัวช่วยเหล่านี้; guard ของขอบเขต config จะล้มเหลวหากโค้ด plugin เรียกใช้หรือนำเข้าตัวช่วยเหล่านี้จาก subpath ของ plugin SDK

สำหรับการ import SDK โดยตรง ให้ใช้ subpath ของ config ที่เจาะจงแทน compatibility barrel แบบกว้าง
`openclaw/plugin-sdk/config-runtime`: ใช้ `config-types` สำหรับ
types, `plugin-config-runtime` สำหรับ assertion ของ config ที่โหลดแล้วและการค้นหา entry ของ plugin,
`runtime-config-snapshot` สำหรับ snapshot ของ process ปัจจุบัน และ
`config-mutation` สำหรับการเขียน Tests ของ bundled plugin ควร mock subpath ที่เจาะจงเหล่านี้
โดยตรงแทนการ mock compatibility barrel แบบกว้าง

โค้ด runtime ภายในของ OpenClaw มีทิศทางเดียวกัน: โหลด config หนึ่งครั้งที่ CLI, gateway หรือขอบเขต process จากนั้นส่งค่านั้นต่อไป การเขียน mutation ที่สำเร็จจะ refresh snapshot ของ process runtime และเลื่อน revision ภายในของมัน; cache ที่มีอายุยาวควร key จาก cache key ที่ runtime เป็นเจ้าของ แทนการ serialize config ภายในเครื่อง โมดูล runtime ที่มีอายุยาวมี scanner แบบไม่ยอมรับเลยสำหรับการเรียก `loadConfig()` จากบริบทแวดล้อม; ให้ใช้ `cfg` ที่ถูกส่งมา, request `context.getRuntimeConfig()` หรือ `getRuntimeConfig()` ที่ขอบเขต process ที่ชัดเจน

เส้นทางการทำงานของ provider และ channel ต้องใช้ snapshot ของ runtime config ที่กำลังทำงาน ไม่ใช่ snapshot ของไฟล์ที่คืนมาเพื่ออ่าน config กลับหรือแก้ไข snapshot ของไฟล์จะรักษาค่าต้นทาง เช่น marker SecretRef สำหรับ UI และการเขียน; callback ของ provider ต้องใช้มุมมอง runtime ที่ resolve แล้ว เมื่อ helper อาจถูกเรียกด้วย snapshot ต้นทางที่กำลังทำงานหรือ snapshot runtime ที่กำลังทำงาน ให้ route ผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่าน credentials

## namespace ของ Runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    ตัวตนของ Agent, ไดเรกทอรี และการจัดการ session

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

    `runEmbeddedAgent(...)` เป็น helper กลางสำหรับเริ่ม turn ปกติของ OpenClaw agent จากโค้ด plugin โดยใช้การ resolve provider/model และการเลือก agent-harness แบบเดียวกับ reply ที่ถูก trigger โดย channel

    `runEmbeddedPiAgent(...)` ยังคงอยู่ในฐานะ alias เพื่อ compatibility

    `resolveThinkingPolicy(...)` คืนระดับ thinking ที่ provider/model รองรับและค่า default ที่เป็น optional Provider plugins เป็นเจ้าของ profile เฉพาะของ model ผ่าน thinking hooks ของตน ดังนั้น tool plugins ควรเรียก helper runtime นี้แทนการ import หรือทำซ้ำรายการ provider

    `normalizeThinkingLevel(...)` แปลงข้อความจากผู้ใช้ เช่น `on`, `x-high` หรือ `extra high` เป็นระดับที่จัดเก็บแบบ canonical ก่อนตรวจสอบกับ policy ที่ resolve แล้ว

    **ตัวช่วย session store** อยู่ภายใต้ `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่ของ model และ provider เริ่มต้น:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    เริ่มและจัดการการรัน subagent เบื้องหลัง

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
    การ override model (`provider`/`model`) ต้องให้ operator opt-in ผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ใน config Plugins ที่ไม่น่าเชื่อถือยังคงรัน subagents ได้ แต่คำขอ override จะถูกปฏิเสธ
    </Warning>

    `deleteSession(...)` สามารถลบ sessions ที่สร้างโดย plugin เดียวกันผ่าน `api.runtime.subagent.run(...)` การลบ session ของผู้ใช้หรือ operator ใดๆ ยังคงต้องใช้ request ของ Gateway ที่อยู่ใน scope ของ admin

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการ nodes ที่เชื่อมต่อและเรียกคำสั่งบน node-host จากโค้ด plugin ที่โหลดโดย Gateway หรือจากคำสั่ง CLI ของ plugin ใช้สิ่งนี้เมื่อ plugin เป็นเจ้าของงาน local บนอุปกรณ์ที่จับคู่ไว้ เช่น browser หรือ audio bridge บน Mac เครื่องอื่น

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway runtime นี้ทำงานใน process เดียวกัน ในคำสั่ง CLI ของ plugin จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งอย่าง `openclaw googlemeet recover-tab` จึงตรวจสอบ nodes ที่จับคู่ไว้จาก terminal ได้ คำสั่ง Node ยังคงผ่านการจับคู่ node ของ Gateway ตามปกติ, allowlists ของคำสั่ง, นโยบาย node-invoke ของ plugin และการจัดการคำสั่งภายใน node

    Plugins ที่ expose คำสั่ง node-host ที่อันตรายควรลงทะเบียนนโยบาย node-invoke ด้วย `api.registerNodeInvokePolicy(...)` นโยบายจะรันใน Gateway หลังจากตรวจสอบ allowlist ของคำสั่งและก่อนส่งต่อคำสั่งไปยัง node ดังนั้นการเรียก `node.invoke` โดยตรงและ plugin tools ระดับสูงกว่าจะใช้เส้นทาง enforcement เดียวกัน

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูก runtime ของ Task Flow เข้ากับ session key ของ OpenClaw ที่มีอยู่หรือบริบท tool ที่เชื่อถือได้ จากนั้นสร้างและจัดการ Task Flows โดยไม่ต้องส่ง owner ในทุกการเรียก

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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมี session key ของ OpenClaw ที่เชื่อถือได้จาก binding layer ของคุณเองอยู่แล้ว อย่า bind จาก input ดิบของผู้ใช้

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

    ใช้ configuration หลัก `messages.tts` และการเลือก provider คืนค่า buffer เสียง PCM + sample rate

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    การวิเคราะห์รูปภาพ เสียง และวิดีโอ

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

    คืนค่า `{ text: undefined }` เมื่อไม่มีเอาต์พุตถูกสร้างขึ้น (เช่น อินพุตที่ถูกข้าม)

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` ยังคงเป็นนามแฝงเพื่อความเข้ากันได้สำหรับ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    การสร้างรูปภาพ

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
    สแนปช็อต config ของ runtime ปัจจุบันและการเขียน config แบบธุรกรรม ควรใช้
    config ที่ถูกส่งเข้ามาในเส้นทางการเรียกที่ทำงานอยู่แล้ว; ใช้
    `current()` เฉพาะเมื่อ handler จำเป็นต้องใช้สแนปช็อตของโปรเซสโดยตรง

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` และ `replaceConfigFile(...)` คืนค่า `followUp`
    เช่น `{ mode: "restart", requiresRestart: true, reason }`
    ซึ่งบันทึกเจตนาของ writer โดยไม่แย่งการควบคุมการรีสตาร์ตจาก
    Gateway

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
    การแปลงข้อมูลยืนยันตัวตนของโมเดลและผู้ให้บริการ

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    การแปลงไดเรกทอรี state และที่เก็บแบบ keyed ที่รองรับด้วย SQLite

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    ที่เก็บแบบ keyed อยู่รอดข้ามการรีสตาร์ตและถูกแยกตาม id ของ Plugin ที่ผูกกับ runtime ข้อจำกัด: `maxEntries` ต่อ namespace, แถวที่ยังมีผล 1,000 แถวต่อ Plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL แบบไม่บังคับ

    <Warning>
    เฉพาะ Plugin ที่มาพร้อมชุดติดตั้งในรุ่นนี้
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    แฟกทอรีเครื่องมือหน่วยความจำและ CLI

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    ตัวช่วย runtime เฉพาะช่องทาง (ใช้งานได้เมื่อโหลด Plugin ช่องทางแล้ว)

    `api.runtime.channel.mentions` คือพื้นผิว shared inbound mention-policy สำหรับ Plugin ช่องทางที่มาพร้อมชุดติดตั้งซึ่งใช้ runtime injection:

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

    ตัวช่วย mention ที่มีให้ใช้:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` จงใจไม่เปิดเผยตัวช่วยความเข้ากันได้ `resolveMentionGating*` รุ่นเก่า ควรใช้เส้นทาง `{ facts, policy }` ที่ปรับให้อยู่ในรูปแบบมาตรฐาน

  </Accordion>
</AccordionGroup>

## การจัดเก็บข้อมูลอ้างอิง runtime

ใช้ `createPluginRuntimeStore` เพื่อจัดเก็บข้อมูลอ้างอิง runtime สำหรับใช้นอก callback `register`:

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
ควรใช้ `pluginId` สำหรับตัวตนของ runtime-store รูปแบบ `key` ระดับต่ำมีไว้สำหรับกรณีที่ไม่พบบ่อยซึ่ง Plugin หนึ่งตั้งใจต้องใช้ช่อง runtime มากกว่าหนึ่งช่อง
</Note>

## ฟิลด์ `api` ระดับบนสุดอื่น ๆ

นอกเหนือจาก `api.runtime` แล้ว อ็อบเจกต์ API ยังมี:

<ParamField path="api.id" type="string">
  id ของ Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  สแนปช็อต config ปัจจุบัน (สแนปช็อต runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อมีให้ใช้)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  config เฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger ที่กำหนดขอบเขต (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือช่วงเริ่มต้น/ตั้งค่าที่เบาก่อนเข้าสู่ entry แบบเต็ม
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  แปลง path เทียบกับ root ของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและ registry
- [entry point ของ SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — อ้างอิง subpath
