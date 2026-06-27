---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างภาพ, การค้นหาเว็บ, เอเจนต์ย่อย, โหนด)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไร
    - คุณกำลังเข้าถึงตัวช่วย config, agent หรือ media จากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูกฉีดเข้าไปซึ่งพร้อมใช้งานสำหรับปลั๊กอิน
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-06-27T18:07:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับอ็อบเจ็กต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุก Plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการนำเข้า host internals โดยตรง

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

## การโหลดและเขียน config

ควรใช้ config ที่ถูกส่งเข้ามาใน active call path อยู่แล้ว เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` ใน callback ของ channel/provider วิธีนี้ทำให้ snapshot ของ process เดียวไหลผ่านงาน แทนการ parse config ซ้ำบน hot paths

ใช้ `api.runtime.config.current()` เฉพาะเมื่อ handler ที่มีอายุยาวต้องการ snapshot ของ process ปัจจุบันและไม่มี config ถูกส่งเข้ามายังฟังก์ชันนั้น ค่าที่คืนมาเป็น readonly; ให้ clone หรือใช้ mutation helper ก่อนแก้ไข

Tool factories ได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายใน callback `execute` ของ tool ที่มีอายุยาวเมื่อ config อาจเปลี่ยนหลังจากสร้างคำนิยามของ tool แล้ว

บันทึกการเปลี่ยนแปลงด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` อย่างชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินการ reload ของ gateway เป็นผู้ตัดสินใจ
- `afterWrite: { mode: "restart", reason: "..." }` บังคับ restart แบบสะอาดเมื่อ writer รู้ว่า hot reload ไม่ปลอดภัย
- `afterWrite: { mode: "none", reason: "..." }` ระงับ automatic reload/restart เฉพาะเมื่อ caller เป็นเจ้าของการติดตามผล

mutation helpers คืนค่า `afterWrite` พร้อมสรุป `followUp` แบบ typed เพื่อให้ caller สามารถ log หรือทดสอบได้ว่ามีการร้องขอ restart หรือไม่ Gateway ยังเป็นเจ้าของการตัดสินใจว่า restart นั้นจะเกิดขึ้นจริงเมื่อใด

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็น compatibility helpers ที่เลิกแนะนำแล้วภายใต้ `runtime-config-load-write` ทั้งสองจะแจ้งเตือนหนึ่งครั้งที่ runtime และยังคงพร้อมใช้งานสำหรับ external plugins เก่าในช่วง migration Bundled plugins ต้องไม่ใช้ตัวช่วยเหล่านี้; config boundary guards จะล้มเหลวหากโค้ด plugin เรียกใช้หรือนำเข้าตัวช่วยเหล่านั้นจาก plugin SDK subpaths

สำหรับ direct SDK imports ให้ใช้ config subpaths ที่เจาะจงแทน compatibility barrel แบบกว้าง
`openclaw/plugin-sdk/config-runtime`: `config-contracts` สำหรับ
types, `plugin-config-runtime` สำหรับ assertions ของ config ที่โหลดแล้วและการค้นหา plugin
entry, `runtime-config-snapshot` สำหรับ snapshot ของ process ปัจจุบัน และ
`config-mutation` สำหรับการเขียน การทดสอบของ bundled plugin ควร mock subpaths ที่เจาะจงเหล่านี้
โดยตรงแทนการ mock compatibility barrel แบบกว้าง

โค้ด runtime ภายใน OpenClaw มีทิศทางเดียวกัน: โหลด config หนึ่งครั้งที่ขอบเขต CLI, gateway หรือ process แล้วส่งค่านั้นต่อไป การเขียน mutation ที่สำเร็จจะ refresh snapshot ของ process runtime และเพิ่ม internal revision ของมัน; caches ที่มีอายุยาวควร key ตาม cache key ที่ runtime เป็นเจ้าของ แทนการ serialize config ภายในโมดูลเอง โมดูล runtime ที่มีอายุยาวมี scanner แบบ zero-tolerance สำหรับการเรียก `loadConfig()` แบบ ambient; ให้ใช้ `cfg` ที่ถูกส่งมา, request `context.getRuntimeConfig()` หรือ `getRuntimeConfig()` ที่ขอบเขต process อย่างชัดเจน

เส้นทางการทำงานของ provider และ channel ต้องใช้ active runtime config snapshot ไม่ใช่ file snapshot ที่คืนมาเพื่อการอ่านกลับหรือแก้ไข config File snapshots จะรักษาค่าต้นทาง เช่น SecretRef markers สำหรับ UI และการเขียน; provider callbacks ต้องการ runtime view ที่ resolve แล้ว เมื่อ helper อาจถูกเรียกด้วย active source snapshot หรือ active runtime snapshot ให้ route ผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่าน credentials

## ยูทิลิตี runtime ที่ใช้ซ้ำได้

ใช้ข้อเท็จจริง `botLoopProtection` ขาเข้าสำหรับข้อความขาเข้าที่ bot เป็นผู้เขียน Core ใช้ shared in-memory sliding-window guard ก่อนบันทึก session record และ dispatch โดยไม่ผูก policy กับ channel เดียว guard จะติดตาม key `(scopeId, conversationId, participant pair)`, นับทั้งสองทิศทางของ pair ร่วมกัน, ใช้ cooldown เมื่อเกิน window budget และ prune entries ที่ไม่ active ตามโอกาส

Channel plugins ที่แสดงพฤติกรรมนี้ให้ operators ควรใช้ shape `channels.defaults.botLoopProtection` ที่ใช้ร่วมกันสำหรับ baseline budgets ก่อน แล้วจึงวาง channel/provider-specific overrides ทับด้านบน config ที่ใช้ร่วมกันใช้วินาทีเพราะเป็น user-facing:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

ส่งข้อเท็จจริง bot-pair ที่ normalize แล้วพร้อม turn ที่ resolve แล้ว Core จะ resolve defaults, การแปลงหน่วย และ semantics ของ `enabled`:

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

ใช้ `openclaw/plugin-sdk/pair-loop-guard-runtime` โดยตรงเฉพาะสำหรับ custom
two-party event loops ที่ไม่ผ่าน shared inbound reply runner

## Runtime namespaces

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

    `runEmbeddedAgent(...)` เป็น helper กลางสำหรับเริ่ม turn ของ OpenClaw agent ตามปกติจากโค้ด plugin โดยใช้การ resolve provider/model และการเลือก agent-harness แบบเดียวกับ replies ที่ถูก trigger จาก channel

    `runEmbeddedPiAgent(...)` ยังคงอยู่ในฐานะ compatibility alias ที่เลิกแนะนำแล้วสำหรับ plugins ที่มีอยู่ โค้ดใหม่ควรใช้ `runEmbeddedAgent(...)`

    `resolveThinkingPolicy(...)` คืนค่า thinking levels ที่ provider/model รองรับและ optional default Provider plugins เป็นเจ้าของ profile เฉพาะ model ผ่าน thinking hooks ของตน ดังนั้น tool plugins ควรเรียก runtime helper นี้แทนการนำเข้าหรือทำซ้ำ provider lists

    `normalizeThinkingLevel(...)` แปลงข้อความจากผู้ใช้ เช่น `on`, `x-high` หรือ `extra high` เป็น stored level ตาม canonical ก่อนตรวจสอบกับ policy ที่ resolve แล้ว

    **Session store helpers** อยู่ภายใต้ `api.runtime.agent.session`:

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

    ควรใช้ `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` สำหรับ workflows ของ session helpers เหล่านี้อ้างถึง sessions ด้วย identity ของ agent/session เพื่อให้ plugins ไม่ต้องพึ่งพา storage shape แบบ legacy `sessions.json` ใช้ `preserveActivity: true` สำหรับ patches ที่เป็น metadata-only ซึ่งไม่ควร refresh activity ของ session และใช้ `replaceEntry: true` เฉพาะเมื่อ callback คืนค่า entry ที่สมบูรณ์และ fields ที่ถูกลบต้องคงสถานะถูกลบไว้

    สำหรับการอ่านและเขียน transcript ให้นำเข้า `openclaw/plugin-sdk/session-transcript-runtime` และใช้ `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` หรือ `withSessionTranscriptWriteLock(...)` พร้อม `{ agentId, sessionKey, sessionId }` APIs เหล่านี้ให้ plugins ระบุ transcript, อ่าน events, append messages, publish updates และรัน operations ที่เกี่ยวข้องภายใต้ transcript write lock เดียวกัน ส่ง `sessionFile` เฉพาะเมื่อปรับโค้ดที่ได้รับ active transcript artifact อยู่แล้วและต้องการให้แต่ละ helper ทำงานกับ artifact เดียวกันนั้น

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)` และ `resolveSessionFilePath(...)` เป็น compatibility helpers สำหรับ plugins ที่ยังจงใจพึ่งพา whole-store แบบ legacy หรือ transcript-file shape โค้ด plugin ใหม่ต้องไม่ใช้ helpers เหล่านั้น และ callers ที่มีอยู่ควร migrate ไปใช้ entry helpers

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่ default model และ provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    รัน text completion ที่ host เป็นเจ้าของโดยไม่ต้องนำเข้า provider internals หรือ
    ทำซ้ำการเตรียม model/auth/base URL ของ OpenClaw

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    helper ใช้เส้นทางการเตรียม simple-completion เดียวกับ runtime ในตัวของ OpenClaw และ host-owned runtime config snapshot Context engines
    ได้รับ capability `llm.complete` ที่ผูกกับ session ดังนั้น model calls จะใช้
    agent ของ active session และจะไม่ silently fall back ไปยัง default agent ผลลัพธ์
    รวม attribution ของ provider/model/agent พร้อม token,
    cache และ estimated cost usage ที่ normalize แล้วเมื่อมีข้อมูล

    <Warning>
    Model overrides ต้องให้ operator opt-in ผ่าน `plugins.entries.<id>.llm.allowModelOverride: true` ใน config ใช้ `plugins.entries.<id>.llm.allowedModels` เพื่อจำกัด trusted plugins ไปยัง targets `provider/model` แบบ canonical ที่ระบุ Cross-agent completions ต้องใช้ `plugins.entries.<id>.llm.allowAgentIdOverride: true`
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    เริ่มและจัดการ background subagent runs

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
    การ override โมเดล (`provider`/`model`) ต้องให้ผู้ปฏิบัติงานเลือกเปิดใช้ผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ใน config Plugin ที่ไม่น่าเชื่อถือยังคงรัน subagent ได้ แต่คำขอ override จะถูกปฏิเสธ
    </Warning>

    `deleteSession(...)` สามารถลบเซสชันที่สร้างโดย Plugin เดียวกันผ่าน `api.runtime.subagent.run(...)` ได้ การลบเซสชันของผู้ใช้หรือผู้ปฏิบัติงานโดยพลการยังคงต้องใช้คำขอ Gateway ที่มีขอบเขตเป็นผู้ดูแลระบบ

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการ Node ที่เชื่อมต่ออยู่และเรียกใช้คำสั่ง node-host จากโค้ด Plugin ที่โหลดโดย Gateway หรือจากคำสั่ง CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงานภายในเครื่องบนอุปกรณ์ที่จับคู่ไว้ เช่น browser หรือ audio bridge บน Mac อีกเครื่อง

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway runtime นี้ทำงานในโปรเซสเดียวกัน ในคำสั่ง CLI ของ Plugin จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งอย่าง `openclaw googlemeet recover-tab` จึงตรวจสอบ Node ที่จับคู่จากเทอร์มินัลได้ คำสั่ง Node ยังคงผ่านการจับคู่ Node ของ Gateway ตามปกติ, allowlist ของคำสั่ง, นโยบาย node-invoke ของ Plugin และการจัดการคำสั่งภายใน Node

    Plugin ที่เปิดเผยคำสั่ง node-host ที่อันตรายควรลงทะเบียนนโยบาย node-invoke ด้วย `api.registerNodeInvokePolicy(...)` นโยบายจะทำงานใน Gateway หลังจากตรวจสอบ allowlist ของคำสั่งและก่อนส่งต่อคำสั่งไปยัง Node ดังนั้นการเรียก `node.invoke` โดยตรงและเครื่องมือ Plugin ระดับสูงกว่าจะใช้เส้นทางบังคับใช้นโยบายเดียวกัน

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูก runtime ของโฟลว์งานกับคีย์เซสชัน OpenClaw ที่มีอยู่หรือบริบทเครื่องมือที่เชื่อถือได้ จากนั้นสร้างและจัดการโฟลว์งานโดยไม่ต้องส่ง owner ในทุกการเรียก

    โฟลว์งานติดตามสถานะเวิร์กโฟลว์หลายขั้นตอนแบบคงทน ไม่ใช่ตัวจัดตารางเวลา:
    ใช้ Cron หรือ `api.session.workflow.scheduleSessionTurn(...)` สำหรับการปลุกในอนาคต
    จากนั้นใช้ `managedFlows` จาก turn ที่จัดตารางไว้เมื่องานนั้น
    ต้องการสถานะโฟลว์ งานลูก การรอ หรือการยกเลิก

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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมีคีย์เซสชัน OpenClaw ที่เชื่อถือได้จากเลเยอร์การผูกของคุณเองอยู่แล้ว อย่าผูกจากอินพุตผู้ใช้ดิบ

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

    ใช้การกำหนดค่า `messages.tts` ของ core และการเลือก provider ส่งคืนบัฟเฟอร์เสียง PCM + อัตราสุ่มตัวอย่าง

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

    ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตถูกสร้างขึ้น (เช่น อินพุตถูกข้าม)

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
    สแนปช็อต config ของ runtime ปัจจุบันและการเขียน config แบบทรานแซกชัน แนะนำให้ใช้
    config ที่ถูกส่งเข้าไปในเส้นทางการเรียกที่ใช้งานอยู่แล้ว; ใช้
    `current()` เฉพาะเมื่อ handler ต้องการสแนปช็อตของโปรเซสโดยตรง

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
    ซึ่งบันทึกเจตนาของผู้เขียนโดยไม่ดึงการควบคุมการรีสตาร์ตไปจาก
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

    `runCommandWithTimeout(...)` ส่งคืน `stdout` และ `stderr` ที่จับไว้ จำนวนการตัดทอนที่เลือกได้
    `code`, `signal`, `killed`, `termination` และ
    `noOutputTimedOut` ผลลัพธ์ timeout และ no-output-timeout จะรายงาน `code: 124`
    เมื่อ child process ไม่ได้ให้ exit code ที่ไม่ใช่ศูนย์ การออกด้วย signal
    ที่ไม่ใช่ timeout ยังสามารถส่งคืน `code: null` ได้ ดังนั้นให้ใช้ `termination` และ
    `noOutputTimedOut` เพื่อแยกแยะเหตุผลของ timeout

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
    การ resolve auth ของโมเดลและ provider

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    การ resolve ไดเรกทอรี state และ keyed storage ที่รองรับด้วย SQLite

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

    Keyed stores จะยังคงอยู่หลังรีสตาร์ต และถูกแยกตาม id ของ Plugin ที่ผูกกับ runtime ใช้ `registerIfAbsent(...)` สำหรับการอ้างสิทธิ์ dedupe แบบ atomic: คืนค่า `true` เมื่อ key ขาดหายหรือหมดอายุแล้วถูกลงทะเบียน หรือ `false` เมื่อมีค่าที่ยังใช้งานอยู่แล้วโดยไม่เขียนทับค่า เวลาเริ่มสร้าง หรือ TTL ข้อจำกัด: `maxEntries` ต่อ namespace, แถวที่ยังใช้งานอยู่ 6,000 แถวต่อ Plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL แบบเลือกได้ เมื่อการเขียนจะเกินเพดานแถวของ Plugin runtime อาจขับแถวที่ยังใช้งานอยู่ที่เก่าที่สุดออกจาก namespace ที่กำลังถูกเขียน namespace พี่น้องจะไม่ถูกขับออกสำหรับการเขียนนั้น และการเขียนจะยังล้มเหลวหาก namespace ไม่สามารถคืนแถวได้เพียงพอ

    <Warning>
    เฉพาะ Plugin ที่ bundled เท่านั้นใน release นี้
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
    ตัวช่วย runtime เฉพาะ channel (พร้อมใช้งานเมื่อโหลด channel Plugin แล้ว)

    `api.runtime.channel.media` คือ surface ที่แนะนำสำหรับการดาวน์โหลดและจัดเก็บสื่อของ channel:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    ใช้ `saveRemoteMedia(...)` เมื่อ URL ระยะไกลควรถูกแปลงเป็นสื่อของ OpenClaw ใช้ `saveResponseMedia(...)` เมื่อ Plugin ดึง `Response` มาแล้วพร้อมการจัดการ auth, redirect หรือ allowlist ที่ Plugin เป็นเจ้าของ ใช้ `readRemoteMediaBuffer(...)` เฉพาะเมื่อ Plugin ต้องการ bytes ดิบสำหรับการตรวจสอบ การแปลง การถอดรหัส หรือการอัปโหลดซ้ำ `fetchRemoteMedia(...)` ยังคงเป็น alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `readRemoteMediaBuffer(...)`

    `api.runtime.channel.mentions` คือ surface นโยบาย mention ขาเข้าที่ใช้ร่วมกันสำหรับ channel Plugin ที่ bundled ซึ่งใช้ runtime injection:

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

    `api.runtime.channel.mentions` ตั้งใจไม่เปิดเผยตัวช่วยความเข้ากันได้ `resolveMentionGating*` รุ่นเก่า แนะนำให้ใช้เส้นทาง `{ facts, policy }` ที่ normalize แล้ว

  </Accordion>
</AccordionGroup>

## การจัดเก็บ reference ของ runtime

ใช้ `createPluginRuntimeStore` เพื่อจัดเก็บ reference ของ runtime สำหรับใช้นอก callback `register`:

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
แนะนำให้ใช้ `pluginId` สำหรับตัวตนของ runtime-store รูปแบบ `key` ระดับต่ำกว่าสำหรับกรณีที่ไม่พบบ่อยซึ่ง Plugin หนึ่งจงใจต้องการ runtime slot มากกว่าหนึ่งช่อง
</Note>

## ฟิลด์ `api` ระดับบนสุดอื่นๆ

นอกเหนือจาก `api.runtime` แล้ว อ็อบเจกต์ API ยังมี:

<ParamField path="api.id" type="string">
  id ของ Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  snapshot config ปัจจุบัน (snapshot runtime ในหน่วยความจำที่ใช้งานอยู่เมื่อพร้อมใช้งาน)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  config เฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger แบบมี scope (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดโหลดปัจจุบัน; `"setup-runtime"` คือช่วง startup/setup แบบเบาก่อน full-entry
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  resolve path ที่สัมพันธ์กับ root ของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ภายใน Plugin](/th/plugins/architecture) — โมเดลความสามารถและ registry
- [entry point ของ SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — reference ของ subpath
