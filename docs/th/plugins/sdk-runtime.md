---
read_when:
    - คุณจำเป็นต้องเรียกใช้ตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างรูปภาพ, การค้นเว็บ, เอเจนต์ย่อย, โหนด)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้านการกำหนดค่า เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูกฉีดซึ่งพร้อมใช้งานสำหรับ Plugin
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-05-06T18:00:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ce16325613efc07bccb8baee3fdb46eb28452b760a6c265d3a25d36bfcbcf0f
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

การอ้างอิงสำหรับออบเจ็กต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุก Plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการ import ส่วนภายในของโฮสต์โดยตรง.

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" href="/th/plugins/sdk-channel-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Plugin ช่องทาง.
  </Card>
  <Card title="Plugin ผู้ให้บริการ" href="/th/plugins/sdk-provider-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Plugin ผู้ให้บริการ.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## การโหลดและเขียน config

ควรใช้ config ที่ถูกส่งเข้ามาในเส้นทางการเรียกที่ทำงานอยู่แล้ว เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` บน callback ของช่องทาง/ผู้ให้บริการ วิธีนี้ช่วยให้ snapshot ของ process หนึ่งชุดไหลผ่านงาน แทนการ parse config ซ้ำใน hot path.

ใช้ `api.runtime.config.current()` เฉพาะเมื่อ handler ที่มีอายุยาวต้องการ snapshot ของ process ปัจจุบันและไม่มี config ถูกส่งให้ฟังก์ชันนั้น ค่าที่คืนมาเป็น readonly; clone หรือใช้ตัวช่วย mutation ก่อนแก้ไข.

factory ของเครื่องมือจะได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายใน callback `execute` ของเครื่องมือที่มีอายุยาวเมื่อ config อาจเปลี่ยนหลังจากสร้างนิยามเครื่องมือแล้ว.

บันทึกการเปลี่ยนแปลงด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` อย่างชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินใจ reload ของ gateway จัดการ.
- `afterWrite: { mode: "restart", reason: "..." }` บังคับ restart แบบสะอาดเมื่อผู้เขียนรู้ว่า hot reload ไม่ปลอดภัย.
- `afterWrite: { mode: "none", reason: "..." }` ระงับ reload/restart อัตโนมัติเฉพาะเมื่อผู้เรียกเป็นเจ้าของการติดตามผล.

ตัวช่วย mutation จะคืน `afterWrite` พร้อมสรุป `followUp` ที่มี type เพื่อให้ผู้เรียกสามารถ log หรือทดสอบได้ว่าพวกเขาขอ restart หรือไม่ Gateway ยังคงเป็นเจ้าของว่า restart นั้นจะเกิดขึ้นจริงเมื่อใด.

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็นตัวช่วย compatibility ที่เลิกใช้แล้วภายใต้ `runtime-config-load-write` ตัวช่วยเหล่านี้จะเตือนหนึ่งครั้งใน runtime และยังคงมีให้ใช้สำหรับ Plugin ภายนอกเก่าในช่วง migration Plugin ที่ bundled ต้องไม่ใช้ตัวช่วยเหล่านี้; ตัว guard ของขอบเขต config จะล้มเหลวหากโค้ด Plugin เรียกใช้หรือ import ตัวช่วยเหล่านี้จาก subpath ของ plugin SDK.

สำหรับการ import SDK โดยตรง ให้ใช้ subpath config ที่เฉพาะเจาะจงแทน barrel compatibility แบบกว้าง
`openclaw/plugin-sdk/config-runtime`: `config-types` สำหรับ
type, `plugin-config-runtime` สำหรับ assertion ของ config ที่โหลดแล้วและการค้นหา
entry ของ Plugin, `runtime-config-snapshot` สำหรับ snapshot ของ process ปัจจุบัน, และ
`config-mutation` สำหรับการเขียน การทดสอบ Plugin ที่ bundled ควร mock subpath เฉพาะเหล่านี้โดยตรง แทนการ mock barrel compatibility แบบกว้าง.

โค้ด runtime ภายในของ OpenClaw มีทิศทางเดียวกัน: โหลด config หนึ่งครั้งที่ขอบเขต CLI, gateway, หรือ process แล้วส่งค่านั้นต่อไป การเขียน mutation ที่สำเร็จจะ refresh snapshot runtime ของ process และเพิ่ม revision ภายใน; cache ที่มีอายุยาวควร key จาก cache key ที่ runtime เป็นเจ้าของ แทนการ serialize config เองภายในเครื่อง โมดูล runtime ที่มีอายุยาวมี scanner แบบไม่ยอมรับเลยสำหรับการเรียก `loadConfig()` แบบ ambient; ใช้ `cfg` ที่ถูกส่งมา, `context.getRuntimeConfig()` ของ request, หรือ `getRuntimeConfig()` ที่ขอบเขต process อย่างชัดเจน.

เส้นทางการทำงานของผู้ให้บริการและช่องทางต้องใช้ snapshot runtime config ที่ทำงานอยู่ ไม่ใช่ snapshot ของไฟล์ที่คืนมาเพื่อ readback หรือแก้ไข config snapshot ของไฟล์จะเก็บค่าต้นทาง เช่น marker SecretRef สำหรับ UI และการเขียน; callback ของผู้ให้บริการต้องการมุมมอง runtime ที่ resolve แล้ว เมื่อตัวช่วยอาจถูกเรียกด้วย snapshot ต้นทางที่ทำงานอยู่หรือ snapshot runtime ที่ทำงานอยู่ ให้ route ผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่าน credentials.

## namespace ของ runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    ตัวตนของ Agent, ไดเรกทอรี, และการจัดการ session.

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

    `runEmbeddedAgent(...)` เป็นตัวช่วยแบบเป็นกลางสำหรับเริ่ม turn ของ Agent OpenClaw ปกติจากโค้ด Plugin ตัวช่วยนี้ใช้การ resolve ผู้ให้บริการ/model และการเลือก agent-harness เดียวกับ reply ที่ถูก trigger จากช่องทาง.

    `runEmbeddedPiAgent(...)` ยังคงอยู่ในฐานะ alias สำหรับ compatibility.

    `resolveThinkingPolicy(...)` คืนระดับ thinking ที่ผู้ให้บริการ/model รองรับและค่า default ที่เป็น optional Plugin ผู้ให้บริการเป็นเจ้าของ profile เฉพาะ model ผ่าน hook thinking ของตน ดังนั้น Plugin เครื่องมือควรเรียกตัวช่วย runtime นี้แทนการ import หรือทำรายการผู้ให้บริการซ้ำ.

    `normalizeThinkingLevel(...)` แปลงข้อความผู้ใช้ เช่น `on`, `x-high`, หรือ `extra high` เป็นระดับที่จัดเก็บแบบ canonical ก่อนตรวจสอบกับนโยบายที่ resolve แล้ว.

    **ตัวช่วย session store** อยู่ภายใต้ `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    ควรใช้ `updateSessionStore(...)` หรือ `updateSessionStoreEntry(...)` สำหรับการเขียน runtime ตัวช่วยเหล่านี้ route ผ่าน writer ของ session-store ที่ Gateway เป็นเจ้าของ, รักษาการอัปเดตที่เกิดพร้อมกัน, และใช้ hot cache ซ้ำ `saveSessionStore(...)` ยังคงมีให้ใช้สำหรับ compatibility และการ rewrite แบบ maintenance-style ออฟไลน์.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่ของ model และผู้ให้บริการ default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    เปิดและจัดการการรัน subagent เบื้องหลัง.

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
    การ override model (`provider`/`model`) ต้องให้ operator opt-in ผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ใน config Plugin ที่ไม่น่าเชื่อถือยังคงรัน subagent ได้ แต่คำขอ override จะถูกปฏิเสธ.
    </Warning>

    `deleteSession(...)` สามารถลบ session ที่สร้างโดย Plugin เดียวกันผ่าน `api.runtime.subagent.run(...)` การลบ session ของผู้ใช้หรือ operator ใด ๆ ยังคงต้องใช้ request ของ Gateway ที่มี scope เป็น admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการ node ที่เชื่อมต่อและ invoke คำสั่ง node-host จากโค้ด Plugin ที่ Gateway โหลด หรือจากคำสั่ง CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงาน local บนอุปกรณ์ที่ pair แล้ว เช่น browser หรือ audio bridge บน Mac เครื่องอื่น.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway runtime นี้อยู่ใน process ในคำสั่ง CLI ของ Plugin runtime นี้จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งเช่น `openclaw googlemeet recover-tab` สามารถตรวจสอบ node ที่ pair แล้วจาก terminal ได้ คำสั่ง Node ยังคงผ่านการจับคู่ node ของ Gateway ตามปกติ, allowlist ของคำสั่ง, นโยบาย node-invoke ของ Plugin, และการจัดการคำสั่งแบบ node-local.

    Plugin ที่เปิดเผยคำสั่ง node-host ที่อันตรายควรลงทะเบียนนโยบาย node-invoke ด้วย `api.registerNodeInvokePolicy(...)` นโยบายจะรันใน Gateway หลังจากตรวจสอบ allowlist ของคำสั่งและก่อนส่งต่อคำสั่งไปยัง node ดังนั้นการเรียก `node.invoke` โดยตรงและเครื่องมือ Plugin ระดับสูงกว่าจะใช้เส้นทางการบังคับใช้นโยบายเดียวกัน.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูก runtime ของ Task Flow กับ session key ของ OpenClaw ที่มีอยู่หรือ context ของเครื่องมือที่เชื่อถือได้ แล้วสร้างและจัดการ Task Flows โดยไม่ต้องส่ง owner ในทุกการเรียก.

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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมี session key ของ OpenClaw ที่เชื่อถือได้แล้วจาก binding layer ของคุณเอง อย่า bind จาก input ผู้ใช้แบบ raw.

  </Accordion>
  <Accordion title="api.runtime.tts">
    การสังเคราะห์ข้อความเป็นเสียงพูด.

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

    ใช้การกำหนดค่า `messages.tts` ของ core และการเลือกผู้ให้บริการ คืน audio buffer PCM + sample rate.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    การวิเคราะห์รูปภาพ, เสียง, และวิดีโอ.

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
    สแนปชอตการกำหนดค่ารันไทม์ปัจจุบันและการเขียนการกำหนดค่าแบบทรานแซกชัน ควรใช้
    การกำหนดค่าที่ถูกส่งเข้าไปในเส้นทางการเรียกใช้งานที่กำลังทำงานอยู่แล้ว ใช้
    `current()` เฉพาะเมื่อแฮนเดลอร์ต้องการสแนปชอตของโปรเซสโดยตรงเท่านั้น

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` และ `replaceConfigFile(...)` คืนค่า
    `followUp` ตัวอย่างเช่น `{ mode: "restart", requiresRestart: true, reason }`
    ซึ่งบันทึกเจตนาของตัวเขียนโดยไม่ยึดการควบคุมการรีสตาร์ตไปจาก
    Gateway

  </Accordion>
  <Accordion title="api.runtime.system">
    ยูทิลิตีระดับระบบ

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
    การแปลงค่า auth ของโมเดลและผู้ให้บริการ

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    การแปลงค่าไดเรกทอรีสถานะและพื้นที่จัดเก็บแบบคีย์ที่รองรับด้วย SQLite

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

    พื้นที่จัดเก็บแบบคีย์จะอยู่รอดหลังรีสตาร์ตและถูกแยกตามรหัส Plugin ที่ผูกกับรันไทม์ ใช้ `registerIfAbsent(...)` สำหรับการอ้างสิทธิ์เพื่อขจัดรายการซ้ำแบบอะตอมิก: คืนค่า `true` เมื่อคีย์หายไปหรือหมดอายุแล้วและถูกลงทะเบียน หรือ `false` เมื่อมีค่าที่ยังใช้งานอยู่แล้วโดยไม่เขียนทับค่า เวลาเริ่มสร้าง หรือ TTL ของค่านั้น ขีดจำกัด: `maxEntries` ต่อ namespace, แถวที่ยังใช้งานอยู่ 1,000 แถวต่อ Plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL แบบเลือกได้

    <Warning>
    เฉพาะ Plugin ที่รวมมากับรุ่นนี้เท่านั้น
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
    ตัวช่วยรันไทม์เฉพาะช่องทาง (พร้อมใช้งานเมื่อโหลด Plugin ช่องทางแล้ว)

    `api.runtime.channel.mentions` คือพื้นผิวนโยบายการกล่าวถึงขาเข้าที่ใช้ร่วมกันสำหรับ Plugin ช่องทางที่รวมมากับระบบและใช้การฉีดรันไทม์:

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

    ตัวช่วยการกล่าวถึงที่พร้อมใช้งาน:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` ตั้งใจไม่เปิดเผยตัวช่วยความเข้ากันได้ `resolveMentionGating*` รุ่นเก่า ควรใช้เส้นทาง `{ facts, policy }` ที่ปรับให้เป็นมาตรฐานแล้ว

  </Accordion>
</AccordionGroup>

## การจัดเก็บการอ้างอิงรันไทม์

ใช้ `createPluginRuntimeStore` เพื่อจัดเก็บการอ้างอิงรันไทม์สำหรับใช้นอกคอลแบ็ก `register`:

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
ควรใช้ `pluginId` สำหรับตัวตนของ runtime-store รูปแบบ `key` ระดับต่ำกว่าสำหรับกรณีที่ไม่พบบ่อย ซึ่ง Plugin หนึ่งตั้งใจต้องการสล็อตรันไทม์มากกว่าหนึ่งสล็อต
</Note>

## ฟิลด์ `api` ระดับบนสุดอื่นๆ

นอกเหนือจาก `api.runtime` แล้ว ออบเจ็กต์ API ยังมี:

<ParamField path="api.id" type="string">
  รหัส Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  สแนปชอตการกำหนดค่าปัจจุบัน (สแนปชอตรันไทม์ในหน่วยความจำที่ใช้งานอยู่เมื่อพร้อมใช้งาน)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  การกำหนดค่าเฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger แบบมีขอบเขต (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่างเริ่มต้น/ตั้งค่าแบบเบาก่อนเข้าสู่ entry แบบเต็ม
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  แปลงค่าเส้นทางแบบสัมพันธ์กับรากของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและรีจิสทรี
- [จุดเข้า SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — อ้างอิง subpath
