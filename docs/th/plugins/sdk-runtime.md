---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างภาพ, การค้นหาเว็บ, ตัวแทนย่อย, โหนด)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้านการกำหนดค่า เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูกแทรกเข้าไปซึ่ง Plugin สามารถใช้งานได้
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-05-04T09:37:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c968f30052ecba4359bdaa9b1c640c1220268933ce01ccef06bcade225b50b7d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับอ็อบเจ็กต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุก Plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการนำเข้า host internals โดยตรง.

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" href="/th/plugins/sdk-channel-plugins">
    คู่มือแบบทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Plugin ช่องทาง.
  </Card>
  <Card title="Plugin ผู้ให้บริการ" href="/th/plugins/sdk-provider-plugins">
    คู่มือแบบทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Plugin ผู้ให้บริการ.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## การโหลดและเขียน Config

ควรใช้ config ที่ถูกส่งเข้าไปในเส้นทางการเรียกที่ใช้งานอยู่แล้ว เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` บน callback ของช่องทาง/ผู้ให้บริการ วิธีนี้ทำให้ snapshot ของกระบวนการเดียวไหลผ่านงาน แทนที่จะ parse config ซ้ำบน hot path.

ใช้ `api.runtime.config.current()` เฉพาะเมื่อ handler ที่มีอายุยาวต้องการ snapshot ของกระบวนการปัจจุบันและไม่มี config ถูกส่งให้ฟังก์ชันนั้น ค่าที่ส่งกลับเป็น readonly ให้ clone หรือใช้ตัวช่วย mutation ก่อนแก้ไข.

Tool factory จะได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายใน callback `execute` ของเครื่องมือที่มีอายุยาวเมื่อ config อาจเปลี่ยนหลังจากสร้างนิยามเครื่องมือแล้ว.

บันทึกการเปลี่ยนแปลงด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือก policy `afterWrite` ที่ชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินใจ reload planner ของ gateway จัดการ.
- `afterWrite: { mode: "restart", reason: "..." }` บังคับ restart แบบสะอาดเมื่อผู้เขียนรู้ว่า hot reload ไม่ปลอดภัย.
- `afterWrite: { mode: "none", reason: "..." }` ระงับ reload/restart อัตโนมัติเฉพาะเมื่อ caller เป็นเจ้าของขั้นตอนติดตามผล.

ตัวช่วย mutation จะส่งกลับ `afterWrite` พร้อม summary `followUp` ที่มี type เพื่อให้ caller สามารถ log หรือทดสอบได้ว่ามีการขอ restart หรือไม่ Gateway ยังเป็นเจ้าของการตัดสินใจว่า restart นั้นจะเกิดขึ้นจริงเมื่อใด.

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็นตัวช่วย compatibility ที่เลิกแนะนำแล้วภายใต้ `runtime-config-load-write` โดยจะเตือนหนึ่งครั้งขณะ runtime และยังคงพร้อมใช้งานสำหรับ Plugin ภายนอกเก่าในช่วง migration window Plugin ที่ bundled มาต้องไม่ใช้ตัวช่วยเหล่านี้; config boundary guards จะล้มเหลวหากโค้ด Plugin เรียกใช้หรือนำเข้าตัวช่วยเหล่านั้นจาก subpath ของ plugin SDK.

สำหรับการ import SDK โดยตรง ให้ใช้ subpath config ที่เจาะจงแทน compatibility barrel แบบกว้าง
`openclaw/plugin-sdk/config-runtime`: ใช้ `config-types` สำหรับ
type, `plugin-config-runtime` สำหรับ assertion ของ config ที่โหลดแล้วและการค้นหา entry ของ Plugin, `runtime-config-snapshot` สำหรับ snapshot ของกระบวนการปัจจุบัน และ
`config-mutation` สำหรับการเขียน การทดสอบ Plugin ที่ bundled ควร mock subpath ที่เจาะจงเหล่านี้โดยตรง แทนการ mock compatibility barrel แบบกว้าง.

โค้ด runtime ภายในของ OpenClaw มีทิศทางเดียวกัน: โหลด config หนึ่งครั้งที่ CLI, gateway, หรือขอบเขตกระบวนการ จากนั้นส่งค่านั้นต่อไป การเขียน mutation ที่สำเร็จจะ refresh snapshot runtime ของกระบวนการและเลื่อน revision ภายใน; cache ที่มีอายุยาวควรอิง key จาก runtime-owned cache key แทนการ serialize config ในเครื่อง โมดูล runtime ที่มีอายุยาวมี scanner แบบไม่ยอมให้มีการเรียก `loadConfig()` แบบ ambient; ใช้ `cfg` ที่ถูกส่งมา, request `context.getRuntimeConfig()`, หรือ `getRuntimeConfig()` ที่ขอบเขตกระบวนการที่ชัดเจน.

เส้นทางการทำงานของผู้ให้บริการและช่องทางต้องใช้ snapshot config runtime ที่ใช้งานอยู่ ไม่ใช่ snapshot ไฟล์ที่ส่งกลับสำหรับอ่าน config ย้อนกลับหรือแก้ไข Snapshot ไฟล์จะรักษาค่าต้นทาง เช่น SecretRef marker สำหรับ UI และการเขียน; callback ของผู้ให้บริการต้องการมุมมอง runtime ที่ resolve แล้ว เมื่อตัวช่วยอาจถูกเรียกด้วย snapshot ต้นทางที่ใช้งานอยู่หรือ snapshot runtime ที่ใช้งานอยู่ ให้ route ผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่าน credentials.

## Namespace ของ Runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    ตัวตนของ Agent, directory, และการจัดการ session.

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

    `runEmbeddedAgent(...)` คือ helper กลางสำหรับเริ่มรอบการทำงานของ Agent OpenClaw ปกติจากโค้ด Plugin โดยใช้การ resolve provider/model และการเลือก agent-harness แบบเดียวกับ reply ที่ถูก trigger จากช่องทาง.

    `runEmbeddedPiAgent(...)` ยังคงอยู่ในฐานะ alias เพื่อ compatibility.

    `resolveThinkingPolicy(...)` ส่งกลับระดับ thinking ที่ provider/model รองรับและค่า default แบบ optional Plugin ผู้ให้บริการเป็นเจ้าของ profile เฉพาะโมเดลผ่าน thinking hooks ของตน ดังนั้น Plugin เครื่องมือควรเรียก helper runtime นี้แทนการนำเข้าหรือทำซ้ำรายการ provider.

    `normalizeThinkingLevel(...)` แปลงข้อความผู้ใช้ เช่น `on`, `x-high`, หรือ `extra high` ให้เป็นระดับที่จัดเก็บแบบ canonical ก่อนตรวจสอบกับ policy ที่ resolve แล้ว.

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

    ควรใช้ `updateSessionStore(...)` หรือ `updateSessionStoreEntry(...)` สำหรับการเขียน runtime ตัวช่วยเหล่านี้ route ผ่าน session-store writer ที่ Gateway เป็นเจ้าของ, รักษาการอัปเดตพร้อมกัน, และ reuse hot cache `saveSessionStore(...)` ยังคงพร้อมใช้งานสำหรับ compatibility และการ rewrite แบบ offline maintenance-style.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่ของโมเดลและผู้ให้บริการ default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    เริ่มและจัดการการรัน subagent เบื้องหลัง.

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
    การ override โมเดล (`provider`/`model`) ต้องให้ operator opt-in ผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ใน config Plugin ที่ไม่น่าเชื่อถือยังสามารถรัน subagent ได้ แต่คำขอ override จะถูกปฏิเสธ.
    </Warning>

    `deleteSession(...)` สามารถลบ session ที่สร้างโดย Plugin เดียวกันผ่าน `api.runtime.subagent.run(...)` ได้ การลบ session ของผู้ใช้หรือ operator แบบ arbitrary ยังคงต้องใช้คำขอ Gateway ที่มี scope เป็น admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการ Node ที่เชื่อมต่ออยู่และเรียก command ของ node-host จากโค้ด Plugin ที่ Gateway โหลด หรือจาก command CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงาน local บนอุปกรณ์ที่จับคู่ไว้ เช่น browser หรือ audio bridge บน Mac อีกเครื่อง.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway runtime นี้เป็น in-process ใน command CLI ของ Plugin จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้น command เช่น `openclaw googlemeet recover-tab` จึงสามารถตรวจสอบ Node ที่จับคู่จาก terminal ได้ Command ของ Node ยังคงผ่านการจับคู่ Node ของ Gateway ตามปกติ, command allowlist, policy node-invoke ของ Plugin, และการจัดการ command ภายใน Node.

    Plugin ที่เปิดเผย command node-host อันตรายควรลงทะเบียน policy node-invoke ด้วย `api.registerNodeInvokePolicy(...)` Policy จะทำงานใน Gateway หลังจากตรวจสอบ command allowlist และก่อนส่งต่อ command ไปยัง Node ดังนั้นการเรียก `node.invoke` โดยตรงและเครื่องมือ Plugin ระดับสูงกว่าจะใช้เส้นทาง enforcement เดียวกัน.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูก runtime ของ Task Flow เข้ากับ session key ของ OpenClaw ที่มีอยู่หรือ trusted tool context จากนั้นสร้างและจัดการ Task Flow โดยไม่ต้องส่ง owner ในทุกการเรียก.

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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมี session key ของ OpenClaw ที่เชื่อถือได้จาก binding layer ของคุณเองแล้ว อย่า bind จาก input ผู้ใช้ดิบ.

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

    ใช้ configuration หลัก `messages.tts` และการเลือกผู้ให้บริการ ส่งกลับ PCM audio buffer + sample rate.

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

    ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตถูกสร้างขึ้น (เช่น อินพุตที่ถูกข้าม)

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` ยังคงเป็นชื่อแทนเพื่อความเข้ากันได้สำหรับ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
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
    สแนปช็อต config runtime ปัจจุบันและการเขียน config แบบทรานแซกชัน ควรใช้
    config ที่ถูกส่งเข้ามาในเส้นทางการเรียกที่ใช้งานอยู่แล้ว ใช้
    `current()` เฉพาะเมื่อ handler ต้องการสแนปช็อตของ process โดยตรง

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` และ `replaceConfigFile(...)` ส่งคืนค่า `followUp`
    เช่น `{ mode: "restart", requiresRestart: true, reason }`
    ซึ่งบันทึกเจตนาของ writer โดยไม่ดึงการควบคุมการรีสตาร์ตออกจาก
    gateway

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
    การแก้ไข auth ของ model และ provider

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    การแก้ไขไดเรกทอรี state และพื้นที่จัดเก็บแบบ keyed ที่สำรองด้วย SQLite

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

    keyed store จะคงอยู่หลังการรีสตาร์ตและถูกแยกตาม plugin id ที่ผูกกับ runtime ใช้ `registerIfAbsent(...)` สำหรับการอ้างสิทธิ์ dedupe แบบ atomic: จะส่งคืน `true` เมื่อ key หายไปหรือหมดอายุและถูกลงทะเบียนแล้ว หรือ `false` เมื่อมีค่า live อยู่แล้วโดยไม่เขียนทับค่า เวลาในการสร้าง หรือ TTL ข้อจำกัด: `maxEntries` ต่อ namespace, แถว live 1,000 แถวต่อ plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL แบบไม่บังคับ

    <Warning>
    เฉพาะ plugin ที่มาพร้อมชุดในรุ่นนี้
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    factory ของเครื่องมือ Memory และ CLI

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    helper runtime เฉพาะ channel (พร้อมใช้งานเมื่อโหลด channel plugin แล้ว)

    `api.runtime.channel.mentions` คือ surface นโยบาย mention ขาเข้าที่ใช้ร่วมกันสำหรับ channel plugin ที่มาพร้อมชุดซึ่งใช้ runtime injection:

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

    helper mention ที่พร้อมใช้งาน:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` ตั้งใจไม่เปิดเผย helper ความเข้ากันได้ `resolveMentionGating*` รุ่นเก่า ควรใช้เส้นทาง `{ facts, policy }` ที่ทำให้เป็นมาตรฐานแล้ว

  </Accordion>
</AccordionGroup>

## การจัดเก็บการอ้างอิง runtime

ใช้ `createPluginRuntimeStore` เพื่อจัดเก็บการอ้างอิง runtime สำหรับใช้นอก callback `register`:

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
ควรใช้ `pluginId` สำหรับตัวตนของ runtime-store รูปแบบ `key` ระดับต่ำมีไว้สำหรับกรณีที่ไม่พบบ่อยซึ่ง plugin หนึ่งตั้งใจต้องการ runtime slot มากกว่าหนึ่งช่อง
</Note>

## ฟิลด์ `api` ระดับบนสุดอื่น ๆ

นอกเหนือจาก `api.runtime` แล้ว ออบเจกต์ API ยังมี:

<ParamField path="api.id" type="string">
  Plugin id
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  สแนปช็อต config ปัจจุบัน (สแนปช็อต runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อพร้อมใช้งาน)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  config เฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger แบบ scoped (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดโหลดปัจจุบัน `"setup-runtime"` คือช่วง startup/setup แบบเบาก่อนเข้า full-entry
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  แก้ไข path แบบสัมพันธ์กับ root ของ plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ภายใน Plugin](/th/plugins/architecture) — capability model และ registry
- [entry point ของ SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง subpath
