---
read_when:
    - ต้องเรียกใช้ตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างรูปภาพ, การค้นหาเว็บ, เอเจนต์ย่อย, โหนด)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้านการกำหนดค่า เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูกฉีดเข้าไปซึ่ง Plugin สามารถใช้งานได้
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-06-30T14:34:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

เอกสารอ้างอิงสำหรับอ็อบเจกต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุก Plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการนำเข้าอินเทอร์นัลของโฮสต์โดยตรง

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/th/plugins/sdk-channel-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Plugin ช่องทาง
  </Card>
  <Card title="Provider plugins" href="/th/plugins/sdk-provider-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ Plugin ผู้ให้บริการ
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## การโหลดและการเขียนการกำหนดค่า

ควรใช้การกำหนดค่าที่ถูกส่งเข้ามาในเส้นทางการเรียกใช้งานที่กำลังทำงานอยู่แล้ว เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` ในคอลแบ็กของช่องทาง/ผู้ให้บริการ วิธีนี้ทำให้สแนปช็อตกระบวนการหนึ่งไหลผ่านงาน แทนที่จะแยกวิเคราะห์การกำหนดค่าซ้ำในเส้นทางร้อน

ใช้ `api.runtime.config.current()` เฉพาะเมื่อแฮนด์เลอร์ที่มีอายุยาวต้องการสแนปช็อตกระบวนการปัจจุบันและไม่มีการส่งการกำหนดค่าเข้ามายังฟังก์ชันนั้น ค่าที่ส่งกลับเป็นแบบอ่านอย่างเดียว ให้โคลนหรือใช้ตัวช่วยการกลายค่า ก่อนแก้ไข

โรงงานเครื่องมือจะได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายในคอลแบ็ก `execute` ของเครื่องมือที่มีอายุยาว เมื่อการกำหนดค่าสามารถเปลี่ยนได้หลังจากนิยามเครื่องมือถูกสร้างขึ้นแล้ว

คงการเปลี่ยนแปลงไว้ด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` อย่างชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินใจโหลด Gateway ใหม่เป็นผู้ตัดสิน
- `afterWrite: { mode: "restart", reason: "..." }` บังคับให้รีสตาร์ตอย่างสะอาดเมื่อผู้เขียนรู้ว่าการโหลดใหม่แบบร้อนไม่ปลอดภัย
- `afterWrite: { mode: "none", reason: "..." }` ระงับการโหลดใหม่/รีสตาร์ตอัตโนมัติเฉพาะเมื่อผู้เรียกเป็นเจ้าของงานติดตามผล

ตัวช่วยการกลายค่าจะส่งกลับ `afterWrite` พร้อมสรุป `followUp` แบบมีชนิด เพื่อให้ผู้เรียกสามารถบันทึกล็อกหรือทดสอบได้ว่ามีการร้องขอรีสตาร์ตหรือไม่ Gateway ยังคงเป็นเจ้าของว่ารีสตาร์ตนั้นจะเกิดขึ้นจริงเมื่อใด

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็นตัวช่วยความเข้ากันได้ที่เลิกใช้แล้วภายใต้ `runtime-config-load-write` ตัวช่วยเหล่านี้เตือนหนึ่งครั้งตอนรันไทม์ และยังคงมีให้ใช้สำหรับ Plugin ภายนอกเก่าระหว่างช่วงย้ายระบบ Plugin ที่บันเดิลมาด้วยต้องไม่ใช้ตัวช่วยเหล่านี้; ตัวป้องกันขอบเขตการกำหนดค่าจะล้มเหลวหากโค้ด Plugin เรียกใช้หรือนำเข้าตัวช่วยเหล่านี้จากพาธย่อยของ Plugin SDK

สำหรับการนำเข้า SDK โดยตรง ให้ใช้พาธย่อยการกำหนดค่าที่เจาะจงแทน barrel ความเข้ากันได้แบบกว้าง
`openclaw/plugin-sdk/config-runtime`: ใช้ `config-contracts` สำหรับ
ชนิด, `plugin-config-runtime` สำหรับการยืนยันการกำหนดค่าที่โหลดไว้แล้วและการค้นหารายการ
Plugin, `runtime-config-snapshot` สำหรับสแนปช็อตกระบวนการปัจจุบัน และ
`config-mutation` สำหรับการเขียน การทดสอบ Plugin ที่บันเดิลมาด้วยควร mock พาธย่อยที่เจาะจงเหล่านี้โดยตรง แทนการ mock barrel ความเข้ากันได้แบบกว้าง

โค้ดรันไทม์ภายในของ OpenClaw มีทิศทางเดียวกัน: โหลดการกำหนดค่าหนึ่งครั้งที่ขอบเขต CLI, Gateway หรือกระบวนการ จากนั้นส่งค่านั้นต่อไป การเขียนการกลายค่าที่สำเร็จจะรีเฟรชสแนปช็อตรันไทม์ของกระบวนการและเพิ่ม revision ภายใน แคชที่มีอายุยาวควรอิงคีย์จากคีย์แคชที่รันไทม์เป็นเจ้าของ แทนการ serialize การกำหนดค่าในเครื่อง โมดูลรันไทม์ที่มีอายุยาวมีสแกนเนอร์แบบไม่ยอมรับเลยสำหรับการเรียก `loadConfig()` แบบแวดล้อม; ใช้ `cfg` ที่ถูกส่งเข้ามา, `context.getRuntimeConfig()` ของคำขอ หรือ `getRuntimeConfig()` ที่ขอบเขตกระบวนการที่ชัดเจน

เส้นทางการทำงานของผู้ให้บริการและช่องทางต้องใช้สแนปช็อตการกำหนดค่ารันไทม์ที่กำลังทำงานอยู่ ไม่ใช่สแนปช็อตไฟล์ที่ส่งกลับมาเพื่ออ่านทวนหรือแก้ไขการกำหนดค่า สแนปช็อตไฟล์จะคงค่าต้นทาง เช่น เครื่องหมาย SecretRef สำหรับ UI และการเขียน; คอลแบ็กผู้ให้บริการต้องการมุมมองรันไทม์ที่แก้ค่าแล้ว เมื่อตัวช่วยอาจถูกเรียกด้วยสแนปช็อตต้นทางที่กำลังทำงานอยู่หรือสแนปช็อตรันไทม์ที่กำลังทำงานอยู่ ให้ส่งผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่านข้อมูลรับรอง

## ยูทิลิตีรันไทม์ที่นำกลับมาใช้ได้

ใช้ข้อเท็จจริง `botLoopProtection` ขาเข้าสำหรับข้อความขาเข้าที่บอตเป็นผู้เขียน Core ใช้ตัวป้องกัน sliding-window ในหน่วยความจำที่ใช้ร่วมกันก่อนบันทึกเซสชันและ dispatch โดยไม่ผูกนโยบายไว้กับช่องทางเดียว ตัวป้องกันติดตามคีย์ `(scopeId, conversationId, participant pair)`, นับทั้งสองทิศทางของคู่ร่วมกัน, ใช้ cooldown เมื่อเกินงบหน้าต่างเวลา และตัดรายการที่ไม่ทำงานออกตามโอกาส

Plugin ช่องทางที่เปิดเผยพฤติกรรมนี้ให้ผู้ปฏิบัติการควรใช้รูปทรง `channels.defaults.botLoopProtection` ที่ใช้ร่วมกันเป็นงบพื้นฐานก่อน จากนั้นค่อยทับด้วยการตั้งค่าเฉพาะช่องทาง/ผู้ให้บริการ การกำหนดค่าที่ใช้ร่วมกันใช้วินาทีเพราะเป็นสิ่งที่ผู้ใช้เห็น:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

ส่งข้อเท็จจริงคู่บอตที่ถูกทำให้เป็นปกติพร้อม turn ที่แก้ค่าแล้ว Core จะแก้ค่าเริ่มต้น, การแปลงหน่วย และความหมายของ `enabled`:

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

ใช้ `openclaw/plugin-sdk/pair-loop-guard-runtime` โดยตรงเฉพาะสำหรับ
ลูปเหตุการณ์สองฝ่ายแบบกำหนดเองที่ไม่ผ่านตัวรันการตอบกลับขาเข้าที่ใช้ร่วมกัน

## เนมสเปซรันไทม์

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    ตัวตน Agent, ไดเรกทอรี และการจัดการเซสชัน

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
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` คือตัวช่วยที่เป็นกลางสำหรับเริ่ม turn ของ Agent OpenClaw ปกติจากโค้ด Plugin ตัวช่วยนี้ใช้การแก้ค่า provider/model และการเลือก agent-harness เดียวกันกับการตอบกลับที่ถูกทริกเกอร์จากช่องทาง

    `runEmbeddedPiAgent(...)` ยังคงอยู่ในฐานะ alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ Plugin ที่มีอยู่ โค้ดใหม่ควรใช้ `runEmbeddedAgent(...)`

    `resolveThinkingPolicy(...)` ส่งกลับระดับการคิดที่ provider/model รองรับและค่าเริ่มต้นที่เป็นตัวเลือก Plugin ผู้ให้บริการเป็นเจ้าของโปรไฟล์เฉพาะโมเดลผ่าน thinking hooks ของตน ดังนั้น Plugin เครื่องมือควรเรียกตัวช่วยรันไทม์นี้ แทนการนำเข้าหรือทำซ้ำรายการผู้ให้บริการ

    `normalizeThinkingLevel(...)` แปลงข้อความผู้ใช้ เช่น `on`, `x-high` หรือ `extra high` เป็นระดับที่จัดเก็บแบบ canonical ก่อนตรวจสอบกับนโยบายที่แก้ค่าแล้ว

    **ตัวช่วยที่เก็บเซสชัน** อยู่ภายใต้ `api.runtime.agent.session`:

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

    ควรใช้ `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` สำหรับเวิร์กโฟลว์เซสชัน ตัวช่วยเหล่านี้อ้างอิงเซสชันด้วยตัวตน agent/session เพื่อให้ Plugin ไม่ต้องพึ่งพารูปทรงพื้นที่จัดเก็บ `sessions.json` แบบเดิม ใช้ `preserveActivity: true` สำหรับแพตช์เฉพาะเมทาดาทาที่ไม่ควรรีเฟรชกิจกรรมเซสชัน และใช้ `replaceEntry: true` เฉพาะเมื่อคอลแบ็กส่งกลับ entry ที่สมบูรณ์และฟิลด์ที่ถูกลบต้องยังคงถูกลบอยู่

    สำหรับการอ่านและเขียน transcript ให้นำเข้า `openclaw/plugin-sdk/session-transcript-runtime` และใช้ `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` หรือ `withSessionTranscriptWriteLock(...)` พร้อม `{ agentId, sessionKey, sessionId }` API เหล่านี้ให้ Plugin ระบุ transcript, อ่านเหตุการณ์, เพิ่มข้อความ, เผยแพร่การอัปเดต และรันการดำเนินการที่เกี่ยวข้องภายใต้ write lock ของ transcript เดียวกัน การส่ง `sessionFile`, การใช้ `resolveSessionTranscriptLegacyFileTarget(...)` หรือการนำเข้า `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` ระดับต่ำจาก `openclaw/plugin-sdk/agent-harness-runtime` เลิกใช้แล้ว; พาธเหล่านั้นมีอยู่เฉพาะสำหรับโค้ดเดิมที่ได้รับ artifact transcript ที่กำลังทำงานอยู่แล้ว

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` และ `resolveAndPersistSessionFile(...)` เป็นตัวช่วยความเข้ากันได้ที่เลิกใช้แล้วสำหรับ Plugin ที่ยังคงตั้งใจพึ่งพารูปทรงทั้ง store หรือไฟล์ transcript แบบเดิม โค้ด Plugin ใหม่ต้องไม่ใช้ตัวช่วยเหล่านี้ และผู้เรียกที่มีอยู่ควรย้ายไปใช้ตัวช่วย entry และตัวช่วยตัวตน transcript

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่ของโมเดลและผู้ให้บริการเริ่มต้น:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    รันการเติมเต็มข้อความที่โฮสต์เป็นเจ้าของ โดยไม่ต้องนำเข้าอินเทอร์นัลของผู้ให้บริการหรือ
    ทำซ้ำการเตรียมโมเดล/การยืนยันตัวตน/base URL ของ OpenClaw

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    ตัวช่วยนี้ใช้เส้นทางการเตรียม simple-completion เดียวกันกับรันไทม์ในตัวของ OpenClaw
    และสแนปช็อตการกำหนดค่ารันไทม์ที่โฮสต์เป็นเจ้าของ เอนจินบริบท
    ได้รับความสามารถ `llm.complete` ที่ผูกกับเซสชัน ดังนั้นการเรียกโมเดลจึงใช้
    Agent ของเซสชันที่กำลังทำงานอยู่ และไม่ fallback ไปยัง Agent เริ่มต้นอย่างเงียบ ๆ ผลลัพธ์
    มีการระบุที่มาของผู้ให้บริการ/โมเดล/Agent พร้อมการใช้งาน token,
    cache และค่าใช้จ่ายโดยประมาณที่ถูกทำให้เป็นปกติเมื่อมีข้อมูล

    <Warning>
    การ override โมเดลต้องให้ผู้ปฏิบัติการเลือกเปิดใช้ผ่าน `plugins.entries.<id>.llm.allowModelOverride: true` ในการกำหนดค่า ใช้ `plugins.entries.<id>.llm.allowedModels` เพื่อจำกัด Plugin ที่เชื่อถือได้ให้ใช้เป้าหมาย canonical `provider/model` ที่เฉพาะเจาะจง การเติมเต็มข้าม Agent ต้องใช้ `plugins.entries.<id>.llm.allowAgentIdOverride: true`
    </Warning>

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
    การ override โมเดล (`provider`/`model`) ต้องให้ operator เลือกใช้ผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ใน config Plugin ที่ไม่น่าเชื่อถือยังคงรันซับเอเจนต์ได้ แต่คำขอ override จะถูกปฏิเสธ
    </Warning>

    `deleteSession(...)` สามารถลบเซสชันที่สร้างโดย Plugin เดียวกันผ่าน `api.runtime.subagent.run(...)` ได้ การลบเซสชันของผู้ใช้หรือ operator ใดๆ ยังคงต้องใช้คำขอ Gateway ที่มีขอบเขต admin

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการ Node ที่เชื่อมต่ออยู่และเรียกใช้คำสั่ง node-host จากโค้ด Plugin ที่โหลดโดย Gateway หรือจากคำสั่ง CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงานภายในเครื่องบนอุปกรณ์ที่จับคู่ไว้ เช่น เบราว์เซอร์หรือบริดจ์เสียงบน Mac อีกเครื่อง

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway runtime นี้อยู่ในกระบวนการเดียวกัน ในคำสั่ง CLI ของ Plugin จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งอย่าง `openclaw googlemeet recover-tab` จึงตรวจสอบ Node ที่จับคู่จากเทอร์มินัลได้ คำสั่ง Node ยังคงผ่านการจับคู่ Node ของ Gateway ตามปกติ, allowlist ของคำสั่ง, นโยบาย node-invoke ของ Plugin และการจัดการคำสั่งภายใน Node

    Plugin ที่เปิดเผยคำสั่ง node-host ที่อันตรายควรลงทะเบียนนโยบาย node-invoke ด้วย `api.registerNodeInvokePolicy(...)` นโยบายจะรันใน Gateway หลังจากตรวจสอบ allowlist ของคำสั่งและก่อนส่งต่อคำสั่งไปยัง Node ดังนั้นการเรียก `node.invoke` โดยตรงและเครื่องมือ Plugin ระดับสูงกว่าจะใช้เส้นทางบังคับใช้เดียวกัน

    <Warning>
    ฟิลด์ `scopes` ที่ไม่บังคับใช้สำหรับขอขอบเขต operator ของ Gateway สำหรับการเรียกใช้ OpenClaw จะให้ผลเฉพาะกับ Plugin ที่รวมมาพร้อมกันและการติดตั้ง Plugin ทางการที่เชื่อถือได้เท่านั้น คำขอจาก Plugin อื่นจะไม่ยกระดับการเรียก ใช้ฟิลด์นี้เฉพาะเมื่อ Plugin ที่เชื่อถือได้ต้องเรียกคำสั่ง Node ด้วยขอบเขต Gateway ที่เข้มงวดกว่า เช่น `operator.admin`
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูก runtime ของ TaskFlow กับคีย์เซสชัน OpenClaw ที่มีอยู่หรือบริบทเครื่องมือที่เชื่อถือได้ จากนั้นสร้างและจัดการ TaskFlow โดยไม่ต้องส่ง owner ในทุกการเรียก

    TaskFlow ติดตามสถานะเวิร์กโฟลว์หลายขั้นตอนที่คงทนถาวร สิ่งนี้ไม่ใช่ scheduler:
    ใช้ Cron หรือ `api.session.workflow.scheduleSessionTurn(...)` สำหรับการปลุกในอนาคต
    จากนั้นใช้ `managedFlows` จากเทิร์นที่กำหนดเวลาไว้เมื่องานนั้น
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

    ใช้การกำหนดค่า `messages.tts` ของ core และการเลือก provider คืนค่าบัฟเฟอร์เสียง PCM + อัตราสุ่มตัวอย่าง

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

    คืนค่า `{ text: undefined }` เมื่อไม่มีการสร้างเอาต์พุต (เช่น อินพุตที่ถูกข้าม)

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
    สแนปช็อต config ของ runtime ปัจจุบันและการเขียน config แบบ transactional ควรใช้
    config ที่ถูกส่งเข้าไปยังเส้นทางการเรียกที่ทำงานอยู่แล้ว ใช้
    `current()` เฉพาะเมื่อตัวจัดการต้องการสแนปช็อตของกระบวนการโดยตรง

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
    ซึ่งบันทึกเจตนาของผู้เขียนโดยไม่ดึงการควบคุมการรีสตาร์ตออกจาก
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

    `runCommandWithTimeout(...)` คืนค่า `stdout` และ `stderr` ที่จับไว้, จำนวนการตัดทอนที่ไม่บังคับ,
    `code`, `signal`, `killed`, `termination` และ
    `noOutputTimedOut` ผลลัพธ์ timeout และ no-output-timeout จะรายงาน `code: 124`
    เมื่อกระบวนการลูกไม่ได้ให้ exit code ที่ไม่เป็นศูนย์ การออกด้วย signal
    ที่ไม่ใช่ timeout ยังคงคืนค่า `code: null` ได้ ดังนั้นให้ใช้ `termination` และ
    `noOutputTimedOut` เพื่อแยกเหตุผล timeout

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
    การแก้ไขไดเรกทอรี state และที่เก็บข้อมูลแบบ key ที่รองรับด้วย SQLite

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

    สโตร์แบบมีคีย์จะคงอยู่หลังการรีสตาร์ตและถูกแยกด้วยรหัส Plugin ที่ผูกกับรันไทม์ ใช้ `registerIfAbsent(...)` สำหรับการอ้างสิทธิ์กำจัดข้อมูลซ้ำแบบอะตอมิก: จะคืนค่า `true` เมื่อคีย์ไม่มีอยู่หรือหมดอายุและถูกลงทะเบียนแล้ว หรือ `false` เมื่อมีค่าที่ยังใช้งานอยู่แล้วโดยไม่เขียนทับค่า เวลาในการสร้าง หรือ TTL ข้อจำกัด: `maxEntries` ต่อเนมสเปซ, แถวที่ยังใช้งานอยู่ 6,000 แถวต่อ Plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL ที่เลือกใช้ได้ เมื่อการเขียนจะเกินขีดจำกัดจำนวนแถวของ Plugin รันไทม์อาจขับแถวที่ยังใช้งานอยู่ที่เก่าที่สุดออกจากเนมสเปซที่กำลังถูกเขียน เนมสเปซข้างเคียงจะไม่ถูกขับออกสำหรับการเขียนนั้น และการเขียนจะยังล้มเหลวหากเนมสเปซไม่สามารถปล่อยแถวได้เพียงพอ

    <Warning>
    เฉพาะ Plugin ที่บันเดิลมาในรุ่นนี้เท่านั้น
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
    ตัวช่วยรันไทม์เฉพาะแชนเนล (พร้อมใช้งานเมื่อโหลด Plugin แชนเนลแล้ว)

    `api.runtime.channel.media` คือพื้นผิวที่แนะนำสำหรับการดาวน์โหลดและจัดเก็บสื่อของแชนเนล:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    ใช้ `saveRemoteMedia(...)` เมื่อ URL ระยะไกลควรกลายเป็นสื่อของ OpenClaw ใช้ `saveResponseMedia(...)` เมื่อ Plugin ดึง `Response` มาแล้วพร้อมการจัดการการยืนยันตัวตน การเปลี่ยนเส้นทาง หรือรายการอนุญาตที่ Plugin เป็นเจ้าของ ใช้ `readRemoteMediaBuffer(...)` เฉพาะเมื่อ Plugin ต้องการไบต์ดิบเพื่อตรวจสอบ แปลง ถอดรหัส หรืออัปโหลดซ้ำ `fetchRemoteMedia(...)` ยังคงเป็นนามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `readRemoteMediaBuffer(...)`

    `api.runtime.channel.mentions` คือพื้นผิวนโยบายการกล่าวถึงขาเข้าที่ใช้ร่วมกันสำหรับ Plugin แชนเนลที่บันเดิลมาซึ่งใช้การฉีดรันไทม์:

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

    `api.runtime.channel.mentions` ตั้งใจไม่เปิดเผยตัวช่วยความเข้ากันได้ `resolveMentionGating*` รุ่นเก่า แนะนำให้ใช้เส้นทาง `{ facts, policy }` ที่ทำให้อยู่ในรูปแบบมาตรฐานแล้ว

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
แนะนำให้ใช้ `pluginId` สำหรับอัตลักษณ์ของ runtime-store รูปแบบ `key` ระดับล่างมีไว้สำหรับกรณีที่พบไม่บ่อยซึ่ง Plugin หนึ่งตั้งใจต้องการช่องรันไทม์มากกว่าหนึ่งช่อง
</Note>

## ฟิลด์ `api` ระดับบนอื่นๆ

นอกเหนือจาก `api.runtime` อ็อบเจ็กต์ API ยังมี:

<ParamField path="api.id" type="string">
  รหัส Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  สแนปช็อตการกำหนดค่าปัจจุบัน (สแนปช็อตรันไทม์ในหน่วยความจำที่ใช้งานอยู่เมื่อพร้อมใช้งาน)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  การกำหนดค่าเฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  ล็อกเกอร์แบบมีขอบเขต (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่างเริ่มต้น/ตั้งค่าแบบเบาก่อนเข้ารายการเต็ม
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  แปลงพาธโดยอิงจากรูทของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและรีจิสทรี
- [จุดเข้าใช้งาน SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — อ้างอิงพาธย่อย
