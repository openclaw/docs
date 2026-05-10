---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างภาพ, การค้นหาเว็บ, เอเจนต์ย่อย, โหนด)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยการกำหนดค่า เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ฉีดเข้ามาซึ่ง Plugin สามารถใช้ได้
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-05-10T19:51:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7771eb89c8ce132cc3c908b3775a89243db310d3d3222452b21ec070a78cd23d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับออบเจ็กต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุก Plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการนำเข้าอินเทอร์นัลของโฮสต์โดยตรง

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/th/plugins/sdk-channel-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Plugin ช่องทาง
  </Card>
  <Card title="Provider plugins" href="/th/plugins/sdk-provider-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Provider Plugin
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## การโหลดและการเขียนการกำหนดค่า

ควรใช้การกำหนดค่าที่ถูกส่งเข้ามาในเส้นทางการเรียกที่ใช้งานอยู่แล้ว เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` ในคอลแบ็กของช่องทาง/ผู้ให้บริการ วิธีนี้ทำให้สแนปช็อตของโปรเซสหนึ่งรายการไหลผ่านงาน แทนที่จะพาร์สการกำหนดค่าใหม่ในเส้นทางร้อน

ใช้ `api.runtime.config.current()` เฉพาะเมื่อแฮนด์เลอร์ที่มีอายุยาวต้องการสแนปช็อตโปรเซสปัจจุบัน และไม่มีการส่งการกำหนดค่าเข้ามาในฟังก์ชันนั้น ค่าที่คืนมาเป็นแบบอ่านอย่างเดียว ให้โคลนหรือใช้ตัวช่วยการกลายพันธุ์ก่อนแก้ไข

โรงงานสร้างเครื่องมือจะได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายในคอลแบ็ก `execute` ของเครื่องมือที่มีอายุยาวเมื่อการกำหนดค่าอาจเปลี่ยนหลังจากสร้างนิยามเครื่องมือแล้ว

คงการเปลี่ยนแปลงไว้ด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` อย่างชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินใจโหลดซ้ำของ Gateway เป็นผู้กำหนด
- `afterWrite: { mode: "restart", reason: "..." }` บังคับให้รีสตาร์ทอย่างสะอาดเมื่อผู้เขียนรู้ว่าการโหลดซ้ำแบบร้อนไม่ปลอดภัย
- `afterWrite: { mode: "none", reason: "..." }` ระงับการโหลดซ้ำ/รีสตาร์ทอัตโนมัติเฉพาะเมื่อผู้เรียกเป็นเจ้าของขั้นตอนติดตามผล

ตัวช่วยการกลายพันธุ์คืนค่า `afterWrite` พร้อมสรุป `followUp` แบบมีชนิด เพื่อให้ผู้เรียกสามารถบันทึกล็อกหรือทดสอบได้ว่าพวกเขาขอรีสตาร์ทหรือไม่ Gateway ยังคงเป็นเจ้าของเวลาที่การรีสตาร์ทนั้นเกิดขึ้นจริง

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็นตัวช่วยความเข้ากันได้ที่เลิกใช้แล้วภายใต้ `runtime-config-load-write` ตัวช่วยเหล่านี้เตือนหนึ่งครั้งขณะรันไทม์ และยังคงมีให้ใช้สำหรับ Plugin ภายนอกเก่าในช่วงเวลาย้ายระบบ Plugin ที่บันเดิลมาด้วยต้องไม่ใช้ตัวช่วยเหล่านี้ การ์ดขอบเขตการกำหนดค่าจะล้มเหลวหากโค้ด Plugin เรียกใช้หรืออิมพอร์ตตัวช่วยเหล่านี้จากพาธย่อยของ Plugin SDK

สำหรับการอิมพอร์ต SDK โดยตรง ให้ใช้พาธย่อยการกำหนดค่าที่เจาะจงแทน barrel ความเข้ากันได้แบบกว้าง
`openclaw/plugin-sdk/config-runtime`: ใช้ `config-contracts` สำหรับ
ชนิด, `plugin-config-runtime` สำหรับการยืนยันการกำหนดค่าที่โหลดแล้วและการค้นหารายการ
Plugin, `runtime-config-snapshot` สำหรับสแนปช็อตโปรเซสปัจจุบัน และ
`config-mutation` สำหรับการเขียน การทดสอบ Plugin ที่บันเดิลมาควร mock พาธย่อยที่เจาะจงเหล่านี้
โดยตรงแทนการ mock barrel ความเข้ากันได้แบบกว้าง

โค้ดรันไทม์ภายในของ OpenClaw มีทิศทางเดียวกัน: โหลดการกำหนดค่าหนึ่งครั้งที่ขอบเขต CLI, Gateway หรือโปรเซส แล้วส่งค่านั้นต่อไป การเขียนแบบกลายพันธุ์ที่สำเร็จจะรีเฟรชสแนปช็อตรันไทม์ของโปรเซสและเลื่อน revision ภายในของมัน แคชที่มีอายุยาวควรอิงคีย์จากคีย์แคชที่รันไทม์เป็นเจ้าของ แทนการ serialize การกำหนดค่าในเครื่อง โมดูลรันไทม์ที่มีอายุยาวมีตัวสแกนแบบไม่ยอมรับการเรียก `loadConfig()` จากบริบทรอบข้าง ให้ใช้ `cfg` ที่ส่งเข้ามา, `context.getRuntimeConfig()` ของคำขอ หรือ `getRuntimeConfig()` ที่ขอบเขตโปรเซสที่ชัดเจน

เส้นทางการดำเนินการของผู้ให้บริการและช่องทางต้องใช้สแนปช็อตการกำหนดค่ารันไทม์ที่ใช้งานอยู่ ไม่ใช่สแนปช็อตไฟล์ที่คืนมาสำหรับการอ่านย้อนกลับหรือการแก้ไขการกำหนดค่า สแนปช็อตไฟล์จะรักษาค่าต้นทาง เช่น มาร์กเกอร์ SecretRef สำหรับ UI และการเขียน คอลแบ็กของผู้ให้บริการต้องใช้มุมมองรันไทม์ที่ resolve แล้ว เมื่อตัวช่วยอาจถูกเรียกด้วยสแนปช็อตต้นทางที่ใช้งานอยู่หรือสแนปช็อตรันไทม์ที่ใช้งานอยู่ ให้ส่งผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่านข้อมูลรับรอง

## เนมสเปซรันไทม์

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    ข้อมูลประจำตัวของ Agent, ไดเรกทอรี และการจัดการเซสชัน

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

    `runEmbeddedAgent(...)` เป็นตัวช่วยกลางสำหรับเริ่มเทิร์น Agent ปกติของ OpenClaw จากโค้ด Plugin โดยใช้การ resolve ผู้ให้บริการ/โมเดลและการเลือก agent-harness แบบเดียวกับการตอบกลับที่ถูกทริกเกอร์จากช่องทาง

    `runEmbeddedPiAgent(...)` ยังคงเป็น alias เพื่อความเข้ากันได้

    `resolveThinkingPolicy(...)` คืนระดับการคิดที่ผู้ให้บริการ/โมเดลรองรับ และค่าเริ่มต้นที่เลือกได้ Provider Plugin เป็นเจ้าของโปรไฟล์เฉพาะโมเดลผ่านฮุกการคิดของตน ดังนั้น Tool Plugin ควรเรียกตัวช่วยรันไทม์นี้แทนการอิมพอร์ตหรือทำซ้ำรายการผู้ให้บริการ

    `normalizeThinkingLevel(...)` แปลงข้อความผู้ใช้ เช่น `on`, `x-high` หรือ `extra high` เป็นระดับที่จัดเก็บแบบ canonical ก่อนตรวจสอบกับนโยบายที่ resolve แล้ว

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

    ควรใช้ `updateSessionStore(...)` หรือ `updateSessionStoreEntry(...)` สำหรับการเขียนขณะรันไทม์ ตัวช่วยเหล่านี้ส่งผ่านตัวเขียน session-store ที่ Gateway เป็นเจ้าของ รักษาการอัปเดตพร้อมกัน และใช้แคชร้อนซ้ำ `saveSessionStore(...)` ยังคงมีให้ใช้เพื่อความเข้ากันได้และการเขียนใหม่แบบงานบำรุงรักษาออฟไลน์

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่โมเดลและผู้ให้บริการเริ่มต้น:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    รันการเติมข้อความที่โฮสต์เป็นเจ้าของโดยไม่ต้องอิมพอร์ตอินเทอร์นัลของผู้ให้บริการหรือ
    ทำซ้ำการเตรียมโมเดล/auth/base URL ของ OpenClaw

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    ตัวช่วยนี้ใช้เส้นทางการเตรียม simple-completion แบบเดียวกับรันไทม์
    ในตัวของ OpenClaw และสแนปช็อตการกำหนดค่ารันไทม์ที่โฮสต์เป็นเจ้าของ เอนจินบริบท
    จะได้รับความสามารถ `llm.complete` ที่ผูกกับเซสชัน ดังนั้นการเรียกโมเดลจะใช้
    Agent ของเซสชันที่ใช้งานอยู่ และไม่ย้อนกลับไปใช้ Agent เริ่มต้นแบบเงียบ ๆ ผลลัพธ์
    รวมการระบุที่มาของผู้ให้บริการ/โมเดล/Agent พร้อม token,
    cache และการใช้งานต้นทุนโดยประมาณที่ normalize แล้วเมื่อมีให้ใช้

    <Warning>
    การ override โมเดลต้องให้ผู้ปฏิบัติการ opt-in ผ่าน `plugins.entries.<id>.llm.allowModelOverride: true` ในการกำหนดค่า ใช้ `plugins.entries.<id>.llm.allowedModels` เพื่อจำกัด Plugin ที่เชื่อถือได้ให้ใช้เป้าหมาย `provider/model` แบบ canonical ที่ระบุ การเติมข้อความข้าม Agent ต้องใช้ `plugins.entries.<id>.llm.allowAgentIdOverride: true`
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    เปิดและจัดการการรัน subagent เบื้องหลัง

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
    การ override โมเดล (`provider`/`model`) ต้องให้ผู้ปฏิบัติการ opt-in ผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ในการกำหนดค่า Plugin ที่ไม่น่าเชื่อถือยังคงรัน subagent ได้ แต่คำขอ override จะถูกปฏิเสธ
    </Warning>

    `deleteSession(...)` สามารถลบเซสชันที่สร้างโดย Plugin เดียวกันผ่าน `api.runtime.subagent.run(...)` ได้ การลบเซสชันของผู้ใช้หรือผู้ปฏิบัติการโดยพลการยังคงต้องใช้คำขอ Gateway ที่มีขอบเขตผู้ดูแลระบบ

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการ Node ที่เชื่อมต่ออยู่ และเรียกใช้คำสั่งโฮสต์ของ Node จากโค้ด Plugin ที่ Gateway โหลด หรือจากคำสั่ง CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงานในเครื่องบนอุปกรณ์ที่จับคู่ไว้ เช่น browser หรือ audio bridge บน Mac อีกเครื่อง

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway รันไทม์นี้อยู่ในโปรเซส ในคำสั่ง CLI ของ Plugin จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งเช่น `openclaw googlemeet recover-tab` สามารถตรวจสอบ Node ที่จับคู่ไว้จากเทอร์มินัลได้ คำสั่ง Node ยังคงผ่านการจับคู่ Node ของ Gateway ปกติ, allowlist คำสั่ง, นโยบาย node-invoke ของ Plugin และการจัดการคำสั่งภายใน Node

    Plugin ที่เปิดเผยคำสั่งโฮสต์ของ Node ที่เป็นอันตรายควรลงทะเบียนนโยบาย node-invoke ด้วย `api.registerNodeInvokePolicy(...)` นโยบายจะรันใน Gateway หลังการตรวจสอบ allowlist คำสั่งและก่อนส่งต่อคำสั่งไปยัง Node ดังนั้นการเรียก `node.invoke` โดยตรงและเครื่องมือ Plugin ระดับสูงกว่าจึงใช้เส้นทางบังคับใช้นโยบายเดียวกัน

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูกรันไทม์ TaskFlow เข้ากับคีย์เซสชัน OpenClaw ที่มีอยู่หรือบริบทเครื่องมือที่เชื่อถือได้ จากนั้นสร้างและจัดการ TaskFlow โดยไม่ต้องส่งเจ้าของในทุกการเรียก

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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมีคีย์เซสชัน OpenClaw ที่เชื่อถือได้จากชั้นการผูกของคุณเองอยู่แล้ว อย่าผูกจากอินพุตผู้ใช้แบบดิบ

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

    ใช้การกำหนดค่า `messages.tts` ของแกนหลักและการเลือกผู้ให้บริการ ส่งคืนบัฟเฟอร์เสียง PCM + อัตราสุ่มตัวอย่าง

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

    ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตถูกสร้างขึ้น (เช่น อินพุตที่ถูกข้าม)

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
    สแนปช็อตการกำหนดค่ารันไทม์ปัจจุบันและการเขียนการกำหนดค่าแบบธุรกรรม ควรใช้
    การกำหนดค่าที่ถูกส่งเข้าไปในเส้นทางการเรียกที่ทำงานอยู่แล้ว ใช้
    `current()` เฉพาะเมื่อแฮนด์เลอร์จำเป็นต้องใช้สแนปช็อตของโปรเซสโดยตรงเท่านั้น

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
    ซึ่งบันทึกเจตนาของตัวเขียนโดยไม่แย่งการควบคุมการรีสตาร์ตไปจาก
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
    การระบุตัวตนสำหรับโมเดลและผู้ให้บริการ

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    การระบุไดเรกทอรีสถานะและพื้นที่จัดเก็บแบบคีย์ที่ใช้ SQLite รองรับ

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

    พื้นที่จัดเก็บแบบคีย์อยู่รอดหลังรีสตาร์ตและแยกออกจากกันตามรหัส Plugin ที่ผูกกับรันไทม์ ใช้ `registerIfAbsent(...)` สำหรับการอ้างสิทธิ์เพื่อขจัดรายการซ้ำแบบอะตอมิก: ค่านี้ส่งคืน `true` เมื่อคีย์หายไปหรือหมดอายุและถูกลงทะเบียนแล้ว หรือ `false` เมื่อมีค่าที่ยังใช้งานอยู่แล้วโดยไม่เขียนทับค่า เวลาเริ่มสร้าง หรือ TTL ของค่านั้น ขีดจำกัด: `maxEntries` ต่อเนมสเปซ, 1,000 แถวที่ยังใช้งานอยู่ต่อ Plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL แบบเลือกได้

    <Warning>
    เฉพาะ Plugin ที่รวมมาในรีลีสนี้เท่านั้น
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

    `api.runtime.channel.mentions` คือพื้นผิวนโยบายการกล่าวถึงขาเข้าที่ใช้ร่วมกันสำหรับ Plugin ช่องทางที่รวมมาและใช้การฉีดรันไทม์:

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

    `api.runtime.channel.mentions` ตั้งใจไม่เปิดเผยตัวช่วยความเข้ากันได้ `resolveMentionGating*` รุ่นเก่า ควรใช้เส้นทาง `{ facts, policy }` ที่ผ่านการทำให้เป็นมาตรฐานแล้ว

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
ควรใช้ `pluginId` สำหรับตัวตนของ runtime-store รูปแบบ `key` ระดับต่ำกว่าสำหรับกรณีที่ไม่พบบ่อยซึ่ง Plugin หนึ่งตั้งใจต้องการช่องรันไทม์มากกว่าหนึ่งช่อง
</Note>

## ฟิลด์ `api` ระดับบนอื่นๆ

นอกเหนือจาก `api.runtime` ออบเจ็กต์ API ยังมี:

<ParamField path="api.id" type="string">
  รหัส Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  สแนปช็อตการกำหนดค่าปัจจุบัน (สแนปช็อตรันไทม์ในหน่วยความจำที่ทำงานอยู่เมื่อพร้อมใช้งาน)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  การกำหนดค่าเฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  ตัวบันทึกล็อกตามขอบเขต (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือช่วงเริ่มต้น/ตั้งค่าก่อนรายการเต็มรูปแบบแบบเบา
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  ระบุพาธโดยอิงจากรูทของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ข้อมูลภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและรีจิสทรี
- [จุดเข้า SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิงพาธย่อย
