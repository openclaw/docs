---
read_when:
    - คุณต้องเรียกตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างภาพ, การค้นหาเว็บ, subagent, nodes)
    - คุณต้องการเข้าใจว่า api.runtime เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วย config, agent หรือ media จากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูกแทรกให้ Plugin ใช้งานได้
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-07-04T20:47:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับอ็อบเจ็กต์ `api.runtime` ที่ฉีดเข้าไปในทุก Plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการนำเข้าอินเทอร์นัลของโฮสต์โดยตรง

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

## การโหลดและการเขียนการกำหนดค่า

ควรใช้การกำหนดค่าที่ถูกส่งเข้ามาในเส้นทางการเรียกที่ใช้งานอยู่แล้ว เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` ในคอลแบ็กของช่องทาง/ผู้ให้บริการ วิธีนี้ทำให้สแนปช็อตของกระบวนการหนึ่งไหลผ่านงาน แทนที่จะพาร์สการกำหนดค่าซ้ำในเส้นทางทำงานที่มีการเรียกบ่อย

ใช้ `api.runtime.config.current()` เฉพาะเมื่อแฮนด์เลอร์ที่มีอายุยาวต้องการสแนปช็อตของกระบวนการปัจจุบัน และไม่มีการส่งการกำหนดค่าเข้ามาในฟังก์ชันนั้น ค่าที่คืนมาเป็นแบบอ่านอย่างเดียว ให้โคลนหรือใช้ตัวช่วยการแก้ไขก่อนแก้ไข

แฟกทอรีเครื่องมือได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายในคอลแบ็ก `execute` ของเครื่องมือที่มีอายุยาวเมื่อการกำหนดค่าอาจเปลี่ยนหลังจากสร้างนิยามเครื่องมือแล้ว

คงการเปลี่ยนแปลงไว้ด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` อย่างชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินใจโหลด Gateway ซ้ำเป็นผู้ตัดสินใจ
- `afterWrite: { mode: "restart", reason: "..." }` บังคับรีสตาร์ตแบบสะอาดเมื่อผู้เขียนรู้ว่าการโหลดซ้ำแบบร้อนไม่ปลอดภัย
- `afterWrite: { mode: "none", reason: "..." }` ระงับการโหลดซ้ำ/รีสตาร์ตอัตโนมัติเฉพาะเมื่อผู้เรียกเป็นเจ้าของงานติดตามผล

ตัวช่วยการแก้ไขคืนค่า `afterWrite` พร้อมสรุป `followUp` แบบมีชนิด เพื่อให้ผู้เรียกสามารถบันทึกล็อกหรือทดสอบว่าตนร้องขอการรีสตาร์ตหรือไม่ Gateway ยังคงเป็นเจ้าของว่ารีสตาร์ตนั้นจะเกิดขึ้นจริงเมื่อใด

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็นตัวช่วยความเข้ากันได้ที่เลิกใช้แล้วภายใต้ `runtime-config-load-write` ตัวช่วยเหล่านี้เตือนหนึ่งครั้งที่รันไทม์ และยังคงพร้อมใช้งานสำหรับ Plugin ภายนอกเก่าระหว่างช่วงย้ายระบบ Plugin ที่บันเดิลไว้ต้องไม่ใช้ตัวช่วยเหล่านี้ การ์ดขอบเขตการกำหนดค่าจะล้มเหลวหากโค้ด Plugin เรียกใช้หรือนำเข้าตัวช่วยเหล่านั้นจากพาธย่อยของ Plugin SDK

สำหรับการนำเข้า SDK โดยตรง ให้ใช้พาธย่อยการกำหนดค่าที่เจาะจงแทน barrel ความเข้ากันได้แบบกว้าง
`openclaw/plugin-sdk/config-runtime`: ใช้ `config-contracts` สำหรับ
ชนิด, `plugin-config-runtime` สำหรับการยืนยันการกำหนดค่าที่โหลดแล้วและการค้นหารายการเข้า Plugin, `runtime-config-snapshot` สำหรับสแนปช็อตกระบวนการปัจจุบัน และ
`config-mutation` สำหรับการเขียน การทดสอบ Plugin ที่บันเดิลไว้ควร mock พาธย่อยที่เจาะจงเหล่านี้โดยตรง แทนที่จะ mock barrel ความเข้ากันได้แบบกว้าง

โค้ดรันไทม์ภายในของ OpenClaw มีทิศทางเดียวกัน: โหลดการกำหนดค่าหนึ่งครั้งที่ CLI, Gateway หรือขอบเขตกระบวนการ แล้วส่งค่านั้นต่อไป การเขียนการแก้ไขที่สำเร็จจะรีเฟรชสแนปช็อตรันไทม์ของกระบวนการและเลื่อน revision ภายใน แคชที่มีอายุยาวควรผูกกับคีย์แคชที่รันไทม์เป็นเจ้าของ แทนการซีเรียลไลซ์การกำหนดค่าในเครื่อง โมดูลรันไทม์ที่มีอายุยาวมีสแกนเนอร์แบบไม่ยอมรับการเรียก `loadConfig()` จากบริบทรอบข้างเลย ให้ใช้ `cfg` ที่ถูกส่งเข้ามา, `context.getRuntimeConfig()` ของคำขอ หรือ `getRuntimeConfig()` ที่ขอบเขตกระบวนการอย่างชัดเจน

เส้นทางการทำงานของผู้ให้บริการและช่องทางต้องใช้สแนปช็อตการกำหนดค่ารันไทม์ที่ใช้งานอยู่ ไม่ใช่สแนปช็อตไฟล์ที่คืนมาสำหรับอ่านกลับหรือแก้ไขการกำหนดค่า สแนปช็อตไฟล์เก็บค่าต้นทาง เช่น เครื่องหมาย SecretRef สำหรับ UI และการเขียน ส่วนคอลแบ็กผู้ให้บริการต้องการมุมมองรันไทม์ที่ resolve แล้ว เมื่อ helper อาจถูกเรียกด้วยสแนปช็อตต้นทางที่ใช้งานอยู่หรือสแนปช็อตรันไทม์ที่ใช้งานอยู่ ให้ส่งผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่านข้อมูลรับรอง

## ยูทิลิตีรันไทม์ที่ใช้ซ้ำได้

ใช้ข้อเท็จจริง `botLoopProtection` ขาเข้าสำหรับข้อความขาเข้าที่บอทเป็นผู้เขียน Core ใช้ guard แบบ sliding-window ในหน่วยความจำร่วมก่อนบันทึกเซสชันและ dispatch โดยไม่ผูกนโยบายกับช่องทางใดช่องทางหนึ่ง guard ติดตามคีย์ `(scopeId, conversationId, participant pair)`, นับทั้งสองทิศทางของคู่ร่วมกัน, ใช้ cooldown เมื่อเกินงบของหน้าต่างเวลา และตัดรายการที่ไม่ใช้งานออกตามโอกาส

Plugin ช่องทางที่เปิดเผยพฤติกรรมนี้ให้ผู้ปฏิบัติงานควรใช้รูปทรง `channels.defaults.botLoopProtection` ร่วมสำหรับงบพื้นฐานก่อน แล้วค่อยวาง override เฉพาะช่องทาง/ผู้ให้บริการไว้ด้านบน การกำหนดค่าร่วมใช้หน่วยวินาทีเพราะเป็นส่วนที่ผู้ใช้เห็น:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

ส่งข้อเท็จจริงคู่บอทที่ทำให้เป็นมาตรฐานแล้วพร้อม turn ที่ resolve แล้ว Core จะ resolve ค่าเริ่มต้น, การแปลงหน่วย และความหมายของ `enabled`:

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

ใช้ `openclaw/plugin-sdk/pair-loop-guard-runtime` โดยตรงเฉพาะสำหรับลูปเหตุการณ์สองฝ่ายแบบกำหนดเองที่ไม่ได้ผ่าน runner การตอบกลับขาเข้าร่วม

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

    `runEmbeddedAgent(...)` เป็น helper กลางสำหรับเริ่ม turn ของ Agent OpenClaw ปกติจากโค้ด Plugin โดยใช้การ resolve ผู้ให้บริการ/โมเดลและการเลือก agent-harness แบบเดียวกับการตอบกลับที่ทริกเกอร์จากช่องทาง

    `runEmbeddedPiAgent(...)` ยังคงอยู่เป็น alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ Plugin ที่มีอยู่ โค้ดใหม่ควรใช้ `runEmbeddedAgent(...)`

    `resolveThinkingPolicy(...)` คืนระดับ thinking ที่ผู้ให้บริการ/โมเดลรองรับและค่าเริ่มต้นที่เป็นตัวเลือก Plugin ผู้ให้บริการเป็นเจ้าของโปรไฟล์เฉพาะโมเดลผ่าน hook thinking ของตน ดังนั้น Plugin เครื่องมือควรเรียก helper รันไทม์นี้แทนการนำเข้าหรือทำซ้ำรายการผู้ให้บริการ

    `normalizeThinkingLevel(...)` แปลงข้อความผู้ใช้ เช่น `on`, `x-high` หรือ `extra high` เป็นระดับที่จัดเก็บตามรูปแบบ canonical ก่อนตรวจสอบกับนโยบายที่ resolve แล้ว

    **ตัวช่วย session store** อยู่ภายใต้ `api.runtime.agent.session`:

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

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    ควรใช้ `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` สำหรับเวิร์กโฟลว์เซสชัน helper เหล่านี้อ้างอิงเซสชันด้วยตัวตน agent/session เพื่อให้ Plugin ไม่ต้องพึ่งพารูปทรง storage `sessions.json` แบบเดิม ใช้ `preserveActivity: true` สำหรับแพตช์เฉพาะเมทาดาทาที่ไม่ควรรีเฟรชกิจกรรมเซสชัน และใช้ `replaceEntry: true` เฉพาะเมื่อคอลแบ็กคืน entry ที่สมบูรณ์และฟิลด์ที่ถูกลบต้องยังคงถูกลบ

    ใช้ `runWithWorkAdmission(...)` เมื่อ Plugin เริ่มงานบนเซสชันที่คงอยู่ คอลแบ็กจะปฏิเสธเซสชันที่ถูกเก็บถาวรหรือถูกแทนที่พร้อมกัน ทำให้การกลายพันธุ์ archive/reset/delete ประสานกับการเสร็จสิ้น และได้รับ `AbortSignal` ที่ต้องส่งต่อไปยังการรัน Agent

    สำหรับการอ่านและเขียน transcript ให้นำเข้า `openclaw/plugin-sdk/session-transcript-runtime` และใช้ `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` หรือ `withSessionTranscriptWriteLock(...)` พร้อม `{ agentId, sessionKey, sessionId }` API เหล่านี้ให้ Plugin ระบุ transcript, อ่านเหตุการณ์, เพิ่มข้อความ, เผยแพร่การอัปเดต และรันการดำเนินการที่เกี่ยวข้องภายใต้ write lock ของ transcript เดียวกัน การส่ง `sessionFile`, การใช้ `resolveSessionTranscriptLegacyFileTarget(...)` หรือการนำเข้า `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` ระดับต่ำจาก `openclaw/plugin-sdk/agent-harness-runtime` เลิกใช้แล้ว พาธเหล่านั้นมีไว้เฉพาะสำหรับโค้ดเก่าที่ได้รับ artifact transcript ที่ใช้งานอยู่แล้ว

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` และ `resolveAndPersistSessionFile(...)` เป็น helper ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ Plugin ที่ยังตั้งใจพึ่งพารูปทรง whole-store หรือ transcript-file แบบเดิม โค้ด Plugin ใหม่ต้องไม่ใช้ helper เหล่านั้น และผู้เรียกที่มีอยู่ควรย้ายไปยัง entry helper และ transcript identity helper

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่โมเดลและผู้ให้บริการเริ่มต้น:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    รัน text completion ที่โฮสต์เป็นเจ้าของโดยไม่ต้องนำเข้าอินเทอร์นัลของผู้ให้บริการหรือทำซ้ำการเตรียมโมเดล/การยืนยันตัวตน/base URL ของ OpenClaw

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    helper ใช้เส้นทางการเตรียม simple-completion แบบเดียวกับรันไทม์ในตัวของ OpenClaw และสแนปช็อตการกำหนดค่ารันไทม์ที่โฮสต์เป็นเจ้าของ เอนจินบริบทได้รับ capability `llm.complete` ที่ผูกกับเซสชัน ดังนั้นการเรียกโมเดลจึงใช้ Agent ของเซสชันที่ใช้งานอยู่และไม่ fallback ไปยัง Agent เริ่มต้นอย่างเงียบ ๆ ผลลัพธ์มี attribution ของผู้ให้บริการ/โมเดล/Agent พร้อม token, cache และการใช้งานค่าใช้จ่ายโดยประมาณที่ทำให้เป็นมาตรฐานแล้วเมื่อมีให้ใช้งาน

    <Warning>
    การแทนที่โมเดลต้องให้ผู้ปฏิบัติการเลือกใช้ผ่าน `plugins.entries.<id>.llm.allowModelOverride: true` ในการกำหนดค่า ใช้ `plugins.entries.<id>.llm.allowedModels` เพื่อจำกัด Plugin ที่เชื่อถือได้ให้ใช้เป้าหมาย `provider/model` แบบบัญญัติเฉพาะ การเติมข้อความข้ามเอเจนต์ต้องใช้ `plugins.entries.<id>.llm.allowAgentIdOverride: true`
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    เปิดใช้งานและจัดการการรัน subagent เบื้องหลัง

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
    การแทนที่โมเดล (`provider`/`model`) ต้องให้ผู้ปฏิบัติการเลือกใช้ผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ในการกำหนดค่า Plugin ที่ไม่น่าเชื่อถือยังคงรัน subagent ได้ แต่คำขอแทนที่จะถูกปฏิเสธ
    </Warning>

    `deleteSession(...)` สามารถลบเซสชันที่ Plugin เดียวกันสร้างผ่าน `api.runtime.subagent.run(...)` ได้ การลบเซสชันของผู้ใช้หรือผู้ปฏิบัติการใดๆ ยังต้องใช้คำขอ Gateway ที่มีขอบเขตผู้ดูแลระบบ

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการโหนดที่เชื่อมต่ออยู่ และเรียกใช้คำสั่งโฮสต์โหนดจากโค้ด Plugin ที่ Gateway โหลด หรือจากคำสั่ง CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงานในเครื่องบนอุปกรณ์ที่จับคู่ไว้ เช่นบริดจ์เบราว์เซอร์หรือเสียงบน Mac เครื่องอื่น

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway รันไทม์นี้อยู่ในกระบวนการเดียวกัน ในคำสั่ง CLI ของ Plugin รันไทม์นี้จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งอย่าง `openclaw googlemeet recover-tab` จึงตรวจสอบโหนดที่จับคู่จากเทอร์มินัลได้ คำสั่ง Node ยังคงผ่านการจับคู่โหนด Gateway ตามปกติ รายการอนุญาตคำสั่ง นโยบาย node-invoke ของ Plugin และการจัดการคำสั่งภายในโหนด

    Plugin ที่เปิดเผยคำสั่งโฮสต์โหนดที่อันตรายควรลงทะเบียนนโยบาย node-invoke ด้วย `api.registerNodeInvokePolicy(...)` นโยบายจะทำงานใน Gateway หลังจากตรวจสอบรายการอนุญาตคำสั่งและก่อนส่งต่อคำสั่งไปยังโหนด ดังนั้นการเรียก `node.invoke` โดยตรงและเครื่องมือ Plugin ระดับสูงกว่าจะใช้เส้นทางบังคับใช้นโยบายเดียวกัน

    <Warning>
    ฟิลด์ `scopes` ที่เป็นทางเลือกจะขอขอบเขตผู้ปฏิบัติการของ Gateway สำหรับการเรียกใช้ OpenClaw จะเคารพค่านี้เฉพาะสำหรับ Plugin ที่รวมมาในชุดและการติดตั้ง Plugin ทางการที่เชื่อถือได้เท่านั้น คำขอจาก Plugin อื่นจะไม่ยกระดับการเรียก ใช้เฉพาะเมื่อ Plugin ที่เชื่อถือได้ต้องเรียกคำสั่งโหนดด้วยขอบเขต Gateway ที่เข้มงวดยิ่งขึ้น เช่น `operator.admin`
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูกรันไทม์ Task Flow กับคีย์เซสชัน OpenClaw ที่มีอยู่หรือบริบทเครื่องมือที่เชื่อถือได้ จากนั้นสร้างและจัดการ Task Flow โดยไม่ต้องส่งเจ้าของในทุกการเรียก

    Task Flow ติดตามสถานะเวิร์กโฟลว์หลายขั้นตอนที่คงทนถาวร มันไม่ใช่ตัวจัดตารางเวลา:
    ใช้ Cron หรือ `api.session.workflow.scheduleSessionTurn(...)` สำหรับการปลุกในอนาคต
    จากนั้นใช้ `managedFlows` จากเทิร์นที่จัดตารางไว้เมื่องานนั้น
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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อคุณมีคีย์เซสชัน OpenClaw ที่เชื่อถือได้จากชั้นการผูกของคุณเองอยู่แล้ว อย่าผูกจากอินพุตผู้ใช้ดิบ

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

    ใช้การกำหนดค่า `messages.tts` ของแกนหลักและการเลือกผู้ให้บริการ ส่งคืนบัฟเฟอร์เสียง PCM + อัตราตัวอย่าง

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

    ส่งคืน `{ text: undefined }` เมื่อไม่มีเอาต์พุตที่สร้างขึ้น (เช่น อินพุตที่ถูกข้าม)

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
    สแนปช็อตการกำหนดค่ารันไทม์ปัจจุบันและการเขียนการกำหนดค่าแบบทรานแซกชัน ควรใช้
    การกำหนดค่าที่ส่งเข้าเส้นทางการเรียกที่ใช้งานอยู่แล้ว ใช้
    `current()` เฉพาะเมื่อแฮนด์เลอร์ต้องการสแนปช็อตของกระบวนการโดยตรง

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

    `runCommandWithTimeout(...)` ส่งคืน `stdout` และ `stderr` ที่จับไว้ จำนวน
    การตัดทอนที่เป็นทางเลือก, `code`, `signal`, `killed`, `termination` และ
    `noOutputTimedOut` ผลลัพธ์ timeout และ no-output-timeout จะรายงาน `code: 124`
    เมื่อกระบวนการลูกไม่ได้ให้รหัสออกที่ไม่เป็นศูนย์ การออกด้วยสัญญาณ
    ที่ไม่ใช่ timeout ยังสามารถส่งคืน `code: null` ได้ ดังนั้นให้ใช้ `termination` และ
    `noOutputTimedOut` เพื่อแยกเหตุผลของ timeout

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
    การแก้ไขสิทธิ์ยืนยันตัวตนของโมเดลและผู้ให้บริการ

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    การระบุไดเรกทอรีสถานะและพื้นที่จัดเก็บแบบคีย์ที่รองรับด้วย SQLite

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

    พื้นที่จัดเก็บแบบคีย์ยังคงอยู่หลังรีสตาร์ตและถูกแยกตามรหัส Plugin ที่ผูกกับรันไทม์ ใช้ `registerIfAbsent(...)` สำหรับการอ้างสิทธิ์ dedupe แบบอะตอมิก: จะคืนค่า `true` เมื่อคีย์ไม่มีอยู่หรือหมดอายุแล้วและถูกลงทะเบียน หรือ `false` เมื่อมีค่าที่ยังใช้งานอยู่แล้วโดยไม่เขียนทับค่า เวลาในการสร้าง หรือ TTL ของค่านั้น ข้อจำกัด: `maxEntries` ต่อ namespace, แถวที่ใช้งานอยู่ 6,000 แถวต่อ Plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL แบบไม่บังคับ เมื่อการเขียนจะทำให้เกินเพดานจำนวนแถวของ Plugin รันไทม์อาจขับแถวที่ใช้งานอยู่ที่เก่าที่สุดออกจาก namespace ที่กำลังเขียนอยู่; namespace พี่น้องจะไม่ถูกขับออกสำหรับการเขียนนั้น และการเขียนยังคงล้มเหลวหาก namespace ไม่สามารถคืนพื้นที่แถวได้เพียงพอ

    <Warning>
    เฉพาะ Plugin ที่รวมมาในรุ่นนี้เท่านั้น
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

    `api.runtime.channel.media` คือพื้นผิวที่แนะนำสำหรับการดาวน์โหลดและจัดเก็บสื่อของช่องทาง:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    ใช้ `saveRemoteMedia(...)` เมื่อ URL ระยะไกลควรถูกแปลงเป็นสื่อของ OpenClaw ใช้ `saveResponseMedia(...)` เมื่อ Plugin ดึง `Response` มาแล้วด้วยการจัดการ auth, redirect หรือ allowlist ที่ Plugin เป็นเจ้าของ ใช้ `readRemoteMediaBuffer(...)` เฉพาะเมื่อ Plugin ต้องการไบต์ดิบสำหรับการตรวจสอบ การแปลง การถอดรหัส หรือการอัปโหลดซ้ำ `fetchRemoteMedia(...)` ยังคงเป็น alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `readRemoteMediaBuffer(...)`

    `api.runtime.channel.mentions` คือพื้นผิวนโยบายการ mention ขาเข้าที่ใช้ร่วมกันสำหรับ Plugin ช่องทางที่รวมมาและใช้การฉีดรันไทม์:

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

    `api.runtime.channel.mentions` ตั้งใจไม่เปิดเผยตัวช่วยความเข้ากันได้ `resolveMentionGating*` รุ่นเก่า แนะนำให้ใช้เส้นทาง `{ facts, policy }` ที่ทำให้อยู่ในรูปแบบมาตรฐานแล้ว

  </Accordion>
</AccordionGroup>

## การจัดเก็บการอ้างอิงรันไทม์

ใช้ `createPluginRuntimeStore` เพื่อจัดเก็บการอ้างอิงรันไทม์สำหรับใช้นอก callback `register`:

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
แนะนำให้ใช้ `pluginId` เป็นอัตลักษณ์ของ runtime-store รูปแบบ `key` ระดับต่ำกว่านั้นมีไว้สำหรับกรณีที่ไม่พบบ่อยซึ่ง Plugin หนึ่งตั้งใจต้องการสล็อตรันไทม์มากกว่าหนึ่งสล็อต
</Note>

## ฟิลด์ `api` ระดับบนอื่น ๆ

นอกเหนือจาก `api.runtime` แล้ว ออบเจ็กต์ API ยังมีสิ่งต่อไปนี้ด้วย:

<ParamField path="api.id" type="string">
  รหัส Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  สแนปชอต config ปัจจุบัน (สแนปชอตรันไทม์ในหน่วยความจำที่ใช้งานอยู่เมื่อพร้อมใช้งาน)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  config เฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  logger แบบจำกัดขอบเขต (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือช่วงเริ่มต้น/ตั้งค่าแบบเบาก่อนเข้า entry เต็มรูปแบบ
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  ระบุเส้นทางโดยอิงจาก root ของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและ registry
- [จุดเข้า SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — อ้างอิง subpath
