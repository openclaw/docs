---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างภาพ, การค้นหาเว็บ, เอเจนต์ย่อย, โหนด)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้านการกำหนดค่า เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ฉีดเข้ามาซึ่ง Plugin สามารถใช้งานได้
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-05-11T20:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d94d9f69c51711800e557274299b0e84679deda4e48c743bf193b7f32fe8d71
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับอ็อบเจกต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุก Plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการนำเข้าภายในของโฮสต์โดยตรง

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" href="/th/plugins/sdk-channel-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Plugin ช่องทาง
  </Card>
  <Card title="Plugin ผู้ให้บริการ" href="/th/plugins/sdk-provider-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Plugin ผู้ให้บริการ
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## การโหลดและเขียน Config

ให้ใช้ Config ที่ถูกส่งเข้ามาในเส้นทางการเรียกที่ใช้งานอยู่แล้วเป็นหลัก เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` ใน callback ของช่องทาง/ผู้ให้บริการ วิธีนี้ทำให้สแนปช็อตของกระบวนการเดียวไหลผ่านงาน แทนการแยกวิเคราะห์ Config ซ้ำใน hot path

ใช้ `api.runtime.config.current()` เฉพาะเมื่อ handler ที่มีอายุยาวต้องใช้สแนปช็อตของกระบวนการปัจจุบันและไม่มี Config ถูกส่งให้ฟังก์ชันนั้น ค่าที่ส่งกลับเป็นแบบอ่านอย่างเดียว ให้ clone หรือใช้ตัวช่วย mutation ก่อนแก้ไข

Tool factory จะได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายใน callback `execute` ของ tool ที่มีอายุยาวเมื่อ Config อาจเปลี่ยนหลังจากสร้างคำนิยาม tool แล้ว

บันทึกการเปลี่ยนแปลงด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` อย่างชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินการ reload ของ Gateway เป็นผู้ตัดสินใจ
- `afterWrite: { mode: "restart", reason: "..." }` บังคับ restart อย่างสะอาดเมื่อผู้เขียนรู้ว่า hot reload ไม่ปลอดภัย
- `afterWrite: { mode: "none", reason: "..." }` ระงับการ reload/restart อัตโนมัติเฉพาะเมื่อผู้เรียกเป็นเจ้าของการดำเนินการต่อ

ตัวช่วย mutation จะส่งคืน `afterWrite` พร้อมสรุป `followUp` ที่มี type เพื่อให้ผู้เรียก log หรือ test ได้ว่ามีการร้องขอ restart หรือไม่ Gateway ยังคงเป็นเจ้าของว่า restart นั้นจะเกิดขึ้นจริงเมื่อใด

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็นตัวช่วยความเข้ากันได้ที่เลิกใช้แล้วภายใต้ `runtime-config-load-write` ตัวช่วยเหล่านี้เตือนหนึ่งครั้งใน runtime และยังคงพร้อมใช้งานสำหรับ Plugin ภายนอกเก่าระหว่างช่วง migration Plugin ที่ bundled ต้องไม่ใช้ตัวช่วยเหล่านี้; ตัว guard ขอบเขต Config จะล้มเหลวถ้าโค้ด Plugin เรียกใช้ตัวช่วยเหล่านี้หรือนำเข้าตัวช่วยจาก subpath ของ Plugin SDK

สำหรับการนำเข้า SDK โดยตรง ให้ใช้ subpath Config แบบเจาะจงแทน compatibility barrel กว้าง
`openclaw/plugin-sdk/config-runtime`: ใช้ `config-contracts` สำหรับ
type, `plugin-config-runtime` สำหรับ assertion ของ Config ที่โหลดแล้วและการค้นหารายการ Plugin,
`runtime-config-snapshot` สำหรับสแนปช็อตกระบวนการปัจจุบัน และ
`config-mutation` สำหรับการเขียน test ของ Plugin ที่ bundled ควร mock subpath แบบเจาะจงเหล่านี้โดยตรง แทนการ mock compatibility barrel กว้าง

โค้ด runtime ภายในของ OpenClaw มีทิศทางเดียวกัน: โหลด Config หนึ่งครั้งที่ขอบเขต CLI, Gateway หรือกระบวนการ แล้วส่งค่านั้นต่อไป การเขียน mutation ที่สำเร็จจะ refresh สแนปช็อต runtime ของกระบวนการและเพิ่ม revision ภายใน cache ที่มีอายุยาวควร key จาก cache key ที่ runtime เป็นเจ้าของ แทนการ serialize Config เองในเครื่อง โมดูล runtime ที่มีอายุยาวมี scanner แบบไม่ยอมรับการเรียก `loadConfig()` แวดล้อมโดยเด็ดขาด; ใช้ `cfg` ที่ถูกส่งมา, `context.getRuntimeConfig()` ของคำขอ หรือ `getRuntimeConfig()` ที่ขอบเขตกระบวนการอย่างชัดเจน

เส้นทางการทำงานของผู้ให้บริการและช่องทางต้องใช้สแนปช็อต Config ของ runtime ที่ใช้งานอยู่ ไม่ใช่สแนปช็อตไฟล์ที่ส่งคืนมาเพื่ออ่านกลับหรือแก้ไข Config สแนปช็อตไฟล์จะคงค่าต้นทาง เช่น marker SecretRef สำหรับ UI และการเขียน; callback ของผู้ให้บริการต้องใช้มุมมอง runtime ที่ resolve แล้ว เมื่อตัวช่วยอาจถูกเรียกด้วยสแนปช็อตต้นทางที่ใช้งานอยู่หรือสแนปช็อต runtime ที่ใช้งานอยู่ ให้ route ผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่าน credential

## Namespace ของ runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    ตัวตนของ agent, ไดเรกทอรี และการจัดการ session

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

    `runEmbeddedAgent(...)` เป็นตัวช่วยกลางสำหรับเริ่มรอบ agent ปกติของ OpenClaw จากโค้ด Plugin โดยใช้การ resolve ผู้ให้บริการ/โมเดลและการเลือก agent harness เดียวกับการตอบกลับที่ถูกกระตุ้นจากช่องทาง

    `runEmbeddedPiAgent(...)` ยังคงอยู่ในฐานะ alias เพื่อความเข้ากันได้

    `resolveThinkingPolicy(...)` ส่งคืนระดับ thinking ที่ผู้ให้บริการ/โมเดลรองรับและค่า default แบบ optional ผู้ให้บริการ Plugin เป็นเจ้าของ profile เฉพาะโมเดลผ่าน hook thinking ของตน ดังนั้น tool Plugin ควรเรียกตัวช่วย runtime นี้แทนการนำเข้าหรือทำซ้ำรายการผู้ให้บริการ

    `normalizeThinkingLevel(...)` แปลงข้อความผู้ใช้ เช่น `on`, `x-high` หรือ `extra high` เป็นระดับที่จัดเก็บตาม canonical ก่อนตรวจสอบกับ policy ที่ resolve แล้ว

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

    ให้ใช้ `updateSessionStore(...)` หรือ `updateSessionStoreEntry(...)` เป็นหลักสำหรับการเขียน runtime ตัวช่วยเหล่านี้ route ผ่านตัวเขียน session-store ที่ Gateway เป็นเจ้าของ, รักษาการอัปเดตพร้อมกัน และใช้ hot cache ซ้ำ `saveSessionStore(...)` ยังคงพร้อมใช้งานเพื่อความเข้ากันได้และการเขียนซ้ำแบบบำรุงรักษา offline

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่โมเดลและผู้ให้บริการ default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    เรียกใช้ text completion ที่โฮสต์เป็นเจ้าของโดยไม่ต้องนำเข้าภายในของผู้ให้บริการหรือ
    ทำซ้ำการเตรียมโมเดล/auth/base URL ของ OpenClaw

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    ตัวช่วยนี้ใช้เส้นทางการเตรียม simple-completion เดียวกับ runtime built-in ของ OpenClaw
    และสแนปช็อต Config runtime ที่โฮสต์เป็นเจ้าของ context engine
    จะได้รับ capability `llm.complete` ที่ผูกกับ session ดังนั้นการเรียกโมเดลจะใช้
    agent ของ session ที่ใช้งานอยู่ และไม่ fallback ไปยัง agent default อย่างเงียบ ๆ
    ผลลัพธ์มี attribution ของผู้ให้บริการ/โมเดล/agent รวมถึงการใช้งาน token,
    cache และค่าใช้จ่ายโดยประมาณที่ถูก normalize เมื่อมีข้อมูล

    <Warning>
    การ override โมเดลต้องให้ operator opt-in ผ่าน `plugins.entries.<id>.llm.allowModelOverride: true` ใน Config ใช้ `plugins.entries.<id>.llm.allowedModels` เพื่อจำกัด Plugin ที่เชื่อถือได้ให้ใช้เป้าหมาย `provider/model` แบบ canonical ที่ระบุ การ completion ข้าม agent ต้องใช้ `plugins.entries.<id>.llm.allowAgentIdOverride: true`
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
    การ override โมเดล (`provider`/`model`) ต้องให้ operator opt-in ผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ใน Config Plugin ที่ไม่เชื่อถือยังคงรัน subagent ได้ แต่คำขอ override จะถูกปฏิเสธ
    </Warning>

    `deleteSession(...)` สามารถลบ session ที่สร้างโดย Plugin เดียวกันผ่าน `api.runtime.subagent.run(...)` การลบ session ของผู้ใช้หรือ operator ใด ๆ ยังคงต้องใช้คำขอ Gateway ที่มี scope admin

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการ Node ที่เชื่อมต่อและเรียกคำสั่งที่โฮสต์บน Node จากโค้ด Plugin ที่โหลดโดย Gateway หรือจากคำสั่ง CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงาน local บนอุปกรณ์ที่จับคู่ไว้ เช่น browser หรือ audio bridge บน Mac เครื่องอื่น

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway runtime นี้เป็นแบบ in-process ในคำสั่ง CLI ของ Plugin จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งเช่น `openclaw googlemeet recover-tab` สามารถตรวจสอบ Node ที่จับคู่ไว้จาก terminal ได้ คำสั่ง Node ยังคงผ่านการจับคู่ Node ของ Gateway ตามปกติ, allowlist คำสั่ง, policy node-invoke ของ Plugin และการจัดการคำสั่งแบบ node-local

    Plugin ที่เปิดเผยคำสั่ง node-host ที่อันตรายควรลงทะเบียน policy node-invoke ด้วย `api.registerNodeInvokePolicy(...)` policy จะรันใน Gateway หลังการตรวจสอบ allowlist คำสั่งและก่อนส่งต่อคำสั่งไปยัง Node ดังนั้นการเรียก `node.invoke` โดยตรงและ tool ระดับสูงของ Plugin จะใช้เส้นทาง enforcement เดียวกัน

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูก runtime ของ Task Flow เข้ากับ session key ของ OpenClaw ที่มีอยู่หรือ context ของ tool ที่เชื่อถือได้ จากนั้นสร้างและจัดการ Task Flow โดยไม่ต้องส่ง owner ในทุกการเรียก

    Task Flow ติดตามสถานะ workflow หลายขั้นตอนแบบ durable ไม่ใช่ scheduler:
    ใช้ Cron หรือ `api.session.workflow.scheduleSessionTurn(...)` สำหรับการปลุกในอนาคต
    จากนั้นใช้ `managedFlows` จากรอบที่ถูก schedule เมื่อการทำงานนั้น
    ต้องการสถานะ flow, งานลูก, การรอ หรือการยกเลิก

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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมีคีย์เซสชัน OpenClaw ที่เชื่อถือได้จากเลเยอร์การผูกของคุณเองอยู่แล้ว อย่าผูกจากข้อมูลดิบที่ผู้ใช้ป้อน

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

    ใช้การกำหนดค่า `messages.tts` ของแกนหลักและการเลือก provider คืนค่าบัฟเฟอร์เสียง PCM + อัตราตัวอย่าง

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

    คืนค่า `{ text: undefined }` เมื่อไม่มีเอาต์พุตถูกสร้างขึ้น (เช่น ข้อมูลอินพุตถูกข้าม)

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` ยังคงเป็น alias เพื่อความเข้ากันได้สำหรับ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
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
    สแนปช็อตการกำหนดค่า runtime ปัจจุบันและการเขียนการกำหนดค่าแบบทรานแซกชัน ควรใช้
    การกำหนดค่าที่ถูกส่งเข้าสู่เส้นทางการเรียกที่กำลังใช้งานอยู่แล้ว ใช้
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

    `mutateConfigFile(...)` และ `replaceConfigFile(...)` คืนค่า `followUp`
    เช่น `{ mode: "restart", requiresRestart: true, reason }`
    ซึ่งบันทึกเจตนาของตัวเขียนโดยไม่ดึงการควบคุมการรีสตาร์ตออกจาก
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
    การแก้ไข auth ของโมเดลและ provider

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    การแก้ไขไดเรกทอรีสถานะและที่เก็บแบบ keyed ที่สำรองด้วย SQLite

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

    ที่เก็บแบบ keyed อยู่รอดหลังรีสตาร์ตและถูกแยกตาม id ของ Plugin ที่ผูกกับ runtime ใช้ `registerIfAbsent(...)` สำหรับการอ้างสิทธิ์ dedupe แบบอะตอมิก: คืนค่า `true` เมื่อคีย์หายไปหรือหมดอายุและถูกลงทะเบียนแล้ว หรือ `false` เมื่อมีค่าสดอยู่แล้วโดยไม่เขียนทับค่า เวลาในการสร้าง หรือ TTL ข้อจำกัด: `maxEntries` ต่อ namespace, แถวสด 1,000 แถวต่อ Plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL แบบไม่บังคับ

    <Warning>
    เฉพาะ Plugin ที่บันเดิลมาในรุ่นนี้เท่านั้น
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    factory ของเครื่องมือหน่วยความจำและ CLI

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    helper ของ runtime เฉพาะ channel (พร้อมใช้งานเมื่อโหลด channel Plugin แล้ว)

    `api.runtime.channel.mentions` คือพื้นผิวนโยบายการ mention ขาเข้าที่ใช้ร่วมกันสำหรับ channel Plugin ที่บันเดิลมาและใช้การฉีด runtime:

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

    helper สำหรับ mention ที่พร้อมใช้งาน:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` ตั้งใจไม่เปิดเผย helper ความเข้ากันได้ `resolveMentionGating*` รุ่นเก่า ควรใช้เส้นทาง `{ facts, policy }` ที่ normalize แล้ว

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
ควรใช้ `pluginId` สำหรับ identity ของ runtime-store รูปแบบ `key` ระดับต่ำกว่ามีไว้สำหรับกรณีที่ไม่พบบ่อย ซึ่ง Plugin หนึ่งตั้งใจต้องการ runtime slot มากกว่าหนึ่งช่อง
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
  สแนปช็อต config ปัจจุบัน (สแนปช็อต runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อมี)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  config เฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger แบบกำหนดขอบเขต (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือช่วงเริ่มต้น/ตั้งค่าขนาดเบาก่อนเข้า entry แบบเต็ม
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  แปลง path โดยอิงจาก root ของ plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ภายในของ Plugin](/th/plugins/architecture) — โมเดล capability และ registry
- [จุดเข้าใช้งาน SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง subpath
