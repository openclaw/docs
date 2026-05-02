---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างภาพ, การค้นหาเว็บ, เอเจนต์ย่อย, โหนด)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้านการกำหนดค่า เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูกฉีดเข้าและพร้อมใช้งานสำหรับ Plugin
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-05-02T20:59:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26df37a2ad0dcd29648e382eb579b6892068af4dea1c47460cfd379458a8081c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับอ็อบเจ็กต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุกปลั๊กอินระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการนำเข้าอินเทอร์นัลของโฮสต์โดยตรง

<CardGroup cols={2}>
  <Card title="ปลั๊กอินช่องทาง" href="/th/plugins/sdk-channel-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับปลั๊กอินช่องทาง
  </Card>
  <Card title="ปลั๊กอินผู้ให้บริการ" href="/th/plugins/sdk-provider-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับปลั๊กอินผู้ให้บริการ
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## การโหลดและเขียนการกำหนดค่า

ควรใช้การกำหนดค่าที่ถูกส่งเข้ามาในเส้นทางการเรียกที่ใช้งานอยู่แล้ว เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` บนคอลแบ็กของช่องทาง/ผู้ให้บริการ วิธีนี้ทำให้สแนปชอตของกระบวนการหนึ่งชุดไหลผ่านงาน แทนการแยกวิเคราะห์การกำหนดค่าซ้ำในเส้นทางร้อน

ใช้ `api.runtime.config.current()` เฉพาะเมื่อแฮนเดลอร์ที่มีอายุยืนต้องการสแนปชอตกระบวนการปัจจุบัน และไม่มีการกำหนดค่าถูกส่งให้ฟังก์ชันนั้น ค่าที่ส่งคืนเป็นแบบอ่านอย่างเดียว ให้โคลนหรือใช้ตัวช่วยการกลายพันธุ์ก่อนแก้ไข

แฟกทอรีเครื่องมือได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายในคอลแบ็ก `execute` ของเครื่องมือที่มีอายุยืน เมื่อการกำหนดค่าอาจเปลี่ยนหลังจากสร้างนิยามเครื่องมือแล้ว

บันทึกการเปลี่ยนแปลงด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` ที่ชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินใจรีโหลดของ Gateway เป็นผู้เลือก
- `afterWrite: { mode: "restart", reason: "..." }` บังคับรีสตาร์ตแบบสะอาดเมื่อผู้เขียนรู้ว่าการรีโหลดแบบร้อนไม่ปลอดภัย
- `afterWrite: { mode: "none", reason: "..." }` ระงับการรีโหลด/รีสตาร์ตอัตโนมัติเฉพาะเมื่อผู้เรียกเป็นเจ้าของขั้นตอนติดตามผล

ตัวช่วยการกลายพันธุ์ส่งคืน `afterWrite` พร้อมสรุป `followUp` แบบมีชนิด เพื่อให้ผู้เรียกสามารถบันทึกล็อกหรือทดสอบได้ว่าตนได้ร้องขอการรีสตาร์ตหรือไม่ Gateway ยังเป็นเจ้าของเวลาที่การรีสตาร์ตนั้นเกิดขึ้นจริง

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็นตัวช่วยความเข้ากันได้ที่เลิกแนะนำแล้วภายใต้ `runtime-config-load-write` โดยจะเตือนหนึ่งครั้งขณะรันไทม์ และยังคงพร้อมใช้งานสำหรับปลั๊กอินภายนอกเก่าในช่วงหน้าต่างการย้าย ปลั๊กอินที่มาพร้อมระบบต้องไม่ใช้ตัวช่วยเหล่านี้ ตัวคุมขอบเขตการกำหนดค่าจะล้มเหลวหากโค้ดปลั๊กอินเรียกใช้หรืออิมพอร์ตตัวช่วยเหล่านี้จากพาธย่อยของ Plugin SDK

สำหรับการอิมพอร์ต SDK โดยตรง ให้ใช้พาธย่อยการกำหนดค่าที่เจาะจงแทน barrel ความเข้ากันได้แบบกว้าง
`openclaw/plugin-sdk/config-runtime`: ใช้ `config-types` สำหรับ
ชนิด, `plugin-config-runtime` สำหรับการยืนยันการกำหนดค่าที่โหลดแล้วและการค้นหารายการปลั๊กอิน,
`runtime-config-snapshot` สำหรับสแนปชอตกระบวนการปัจจุบัน และ
`config-mutation` สำหรับการเขียน การทดสอบปลั๊กอินที่มาพร้อมระบบควร mock พาธย่อยที่เจาะจงเหล่านี้โดยตรง แทนการ mock barrel ความเข้ากันได้แบบกว้าง

โค้ดรันไทม์ภายในของ OpenClaw มีทิศทางเดียวกัน: โหลดการกำหนดค่าหนึ่งครั้งที่ CLI, Gateway หรือขอบเขตกระบวนการ แล้วส่งค่านั้นต่อไป การเขียนการกลายพันธุ์ที่สำเร็จจะรีเฟรชสแนปชอตรันไทม์ของกระบวนการและเลื่อน revision ภายใน แคชที่มีอายุยืนควรใช้คีย์แคชที่รันไทม์เป็นเจ้าของเป็นคีย์ แทนการ serialize การกำหนดค่าในเครื่อง โมดูลรันไทม์ที่มีอายุยืนมีตัวสแกนแบบไม่ยอมให้ผ่านสำหรับการเรียก `loadConfig()` แบบแวดล้อม ให้ใช้ `cfg` ที่ส่งเข้ามา, `context.getRuntimeConfig()` ของคำขอ หรือ `getRuntimeConfig()` ที่ขอบเขตกระบวนการที่ชัดเจน

เส้นทางการดำเนินการของผู้ให้บริการและช่องทางต้องใช้สแนปชอตการกำหนดค่ารันไทม์ที่ใช้งานอยู่ ไม่ใช่สแนปชอตไฟล์ที่ส่งคืนสำหรับการอ่านคืนหรือแก้ไขการกำหนดค่า สแนปชอตไฟล์จะคงค่าต้นทาง เช่น มาร์กเกอร์ SecretRef สำหรับ UI และการเขียน ส่วนคอลแบ็กของผู้ให้บริการต้องการมุมมองรันไทม์ที่แก้ค่าแล้ว เมื่อตัวช่วยอาจถูกเรียกด้วยสแนปชอตต้นทางที่ใช้งานอยู่หรือสแนปชอตรันไทม์ที่ใช้งานอยู่ ให้ส่งผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่านข้อมูลรับรอง

## เนมสเปซรันไทม์

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    ตัวตนของเอเจนต์ ไดเรกทอรี และการจัดการเซสชัน

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

    `runEmbeddedAgent(...)` เป็นตัวช่วยที่เป็นกลางสำหรับเริ่มรอบเอเจนต์ OpenClaw ปกติจากโค้ดปลั๊กอิน โดยใช้การแก้ค่า provider/model และการเลือก agent-harness แบบเดียวกับการตอบกลับที่ถูกทริกเกอร์โดยช่องทาง

    `runEmbeddedPiAgent(...)` ยังคงเป็นนามแฝงเพื่อความเข้ากันได้

    `resolveThinkingPolicy(...)` ส่งคืนระดับการคิดที่รองรับของ provider/model และค่าเริ่มต้นที่เป็นทางเลือก ปลั๊กอินผู้ให้บริการเป็นเจ้าของโปรไฟล์เฉพาะโมเดลผ่าน hook การคิดของตน ดังนั้นปลั๊กอินเครื่องมือควรเรียกตัวช่วยรันไทม์นี้แทนการนำเข้าหรือทำซ้ำรายการผู้ให้บริการ

    `normalizeThinkingLevel(...)` แปลงข้อความผู้ใช้ เช่น `on`, `x-high` หรือ `extra high` เป็นระดับที่จัดเก็บตามรูปแบบมาตรฐานก่อนตรวจสอบกับนโยบายที่แก้ค่าแล้ว

    **ตัวช่วยที่เก็บเซสชัน** อยู่ภายใต้ `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    ควรใช้ `updateSessionStore(...)` หรือ `updateSessionStoreEntry(...)` สำหรับการเขียนขณะรันไทม์ ทั้งสองจะส่งผ่าน writer ของ session-store ที่ Gateway เป็นเจ้าของ รักษาการอัปเดตพร้อมกัน และนำแคชร้อนกลับมาใช้ `saveSessionStore(...)` ยังคงพร้อมใช้งานเพื่อความเข้ากันได้และการเขียนใหม่แบบงานบำรุงรักษาออฟไลน์

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่ของโมเดลและผู้ให้บริการเริ่มต้น:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    เปิดใช้และจัดการการรัน subagent เบื้องหลัง

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
    การ override โมเดล (`provider`/`model`) ต้องให้ผู้ปฏิบัติการเลือกเปิดผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ในการกำหนดค่า ปลั๊กอินที่ไม่น่าเชื่อถือยังสามารถรัน subagent ได้ แต่คำขอ override จะถูกปฏิเสธ
    </Warning>

    `deleteSession(...)` สามารถลบเซสชันที่สร้างโดยปลั๊กอินเดียวกันผ่าน `api.runtime.subagent.run(...)` ได้ การลบเซสชันของผู้ใช้หรือผู้ปฏิบัติการใดๆ ยังต้องใช้คำขอ Gateway ที่มีขอบเขตผู้ดูแลระบบ

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการโหนดที่เชื่อมต่อและเรียกคำสั่งที่โฮสต์บนโหนดจากโค้ดปลั๊กอินที่โหลดโดย Gateway หรือจากคำสั่ง CLI ของปลั๊กอิน ใช้สิ่งนี้เมื่อปลั๊กอินเป็นเจ้าของงานในเครื่องบนอุปกรณ์ที่จับคู่ไว้ เช่น เบราว์เซอร์หรือสะพานเสียงบน Mac อีกเครื่องหนึ่ง

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway รันไทม์นี้อยู่ในกระบวนการเดียวกัน ในคำสั่ง CLI ของปลั๊กอิน รันไทม์นี้จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งอย่าง `openclaw googlemeet recover-tab` จึงสามารถตรวจสอบโหนดที่จับคู่จากเทอร์มินัลได้ คำสั่งโหนดยังคงผ่านการจับคู่โหนดของ Gateway, allowlist คำสั่ง, นโยบาย node-invoke ของปลั๊กอิน และการจัดการคำสั่งภายในโหนดตามปกติ

    ปลั๊กอินที่เปิดเผยคำสั่งโฮสต์โหนดที่อันตรายควรลงทะเบียนนโยบาย node-invoke ด้วย `api.registerNodeInvokePolicy(...)` นโยบายจะรันใน Gateway หลังจากการตรวจสอบ allowlist คำสั่งและก่อนส่งต่อคำสั่งไปยังโหนด ดังนั้นการเรียก `node.invoke` โดยตรงและเครื่องมือปลั๊กอินระดับสูงจะแชร์เส้นทางการบังคับใช้เดียวกัน

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูกรันไทม์ Task Flow เข้ากับคีย์เซสชัน OpenClaw ที่มีอยู่หรือบริบทเครื่องมือที่เชื่อถือได้ จากนั้นสร้างและจัดการ Task Flows โดยไม่ต้องส่ง owner ในทุกการเรียก

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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมีคีย์เซสชัน OpenClaw ที่เชื่อถือได้จากชั้นการผูกของคุณเองแล้ว อย่าผูกจากอินพุตผู้ใช้ดิบ

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

    ใช้การกำหนดค่า `messages.tts` หลักและการเลือกผู้ให้บริการ ส่งคืนบัฟเฟอร์เสียง PCM + อัตราสุ่มตัวอย่าง

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

    ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตถูกสร้างขึ้น (เช่น อินพุตถูกข้าม)

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` ยังคงเป็น alias สำหรับความเข้ากันได้กับ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
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
    สแนปช็อต config runtime ปัจจุบันและการเขียน config แบบธุรกรรม ควรใช้
    config ที่ถูกส่งเข้ามาในเส้นทางการเรียกใช้งานที่ใช้งานอยู่แล้ว ใช้
    `current()` เฉพาะเมื่อ handler ต้องการสแนปช็อตของ process โดยตรงเท่านั้น

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
    ซึ่งบันทึกเจตนาของตัวเขียนโดยไม่ดึงการควบคุมการรีสตาร์ตออกจาก
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
    การบันทึก log

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
    การ resolve ไดเรกทอรีสถานะและพื้นที่จัดเก็บแบบคีย์ที่ใช้ SQLite เป็นฐาน

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

    พื้นที่จัดเก็บแบบคีย์จะคงอยู่หลังรีสตาร์ตและถูกแยกตาม id ของ Plugin ที่ผูกกับ runtime ขีดจำกัด: `maxEntries` ต่อ namespace, แถวที่ใช้งานอยู่ 1,000 แถวต่อ Plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL แบบไม่บังคับ

    <Warning>
    เฉพาะ Plugin ที่รวมมาใน release นี้เท่านั้น
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
    helper runtime เฉพาะช่องทาง (พร้อมใช้งานเมื่อโหลด Plugin ของช่องทางแล้ว)

    `api.runtime.channel.mentions` คือพื้นผิวนโยบาย mention ขาเข้าที่ใช้ร่วมกันสำหรับ Plugin ช่องทางที่รวมมาและใช้ runtime injection:

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

    `api.runtime.channel.mentions` ตั้งใจไม่เปิดเผย helper ความเข้ากันได้รุ่นเก่า `resolveMentionGating*` ควรใช้เส้นทาง `{ facts, policy }` ที่ปรับให้เป็นมาตรฐานแล้ว

  </Accordion>
</AccordionGroup>

## การจัดเก็บการอ้างอิง runtime

ใช้ `createPluginRuntimeStore` เพื่อจัดเก็บการอ้างอิง runtime สำหรับใช้นอก callback `register`:

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
ควรใช้ `pluginId` สำหรับ identity ของ runtime-store รูปแบบ `key` ระดับต่ำกว่ามีไว้สำหรับกรณีที่ไม่พบบ่อยซึ่ง Plugin หนึ่งตั้งใจต้องการ runtime slot มากกว่าหนึ่งรายการ
</Note>

## ฟิลด์ `api` ระดับบนอื่น ๆ

นอกเหนือจาก `api.runtime` แล้ว object API ยังมี:

<ParamField path="api.id" type="string">
  id ของ Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อแสดงผลของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  สแนปช็อต config ปัจจุบัน (สแนปช็อต runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อพร้อมใช้งาน)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  config เฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger ที่จำกัดขอบเขต (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน `"setup-runtime"` คือหน้าต่าง startup/setup แบบเบาก่อน full-entry
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resolve path ที่สัมพันธ์กับ root ของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ข้อมูลภายในของ Plugin](/th/plugins/architecture) — โมเดล capability และ registry
- [entry point ของ SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — อ้างอิง subpath
