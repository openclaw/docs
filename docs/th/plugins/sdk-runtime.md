---
read_when:
    - คุณต้องเรียกตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างรูปภาพ, การค้นเว็บ, เอเจนต์ย่อย, โหนด)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้านการกำหนดค่า เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ถูกฉีดและพร้อมให้ Plugin ใช้งาน
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-06-28T20:44:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับอ็อบเจ็กต์ `api.runtime` ที่ถูกฉีดเข้าไปในทุก plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการ import ส่วนภายในของโฮสต์โดยตรง

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/th/plugins/sdk-channel-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ plugin ช่องทาง
  </Card>
  <Card title="Provider plugins" href="/th/plugins/sdk-provider-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทสำหรับ plugin ผู้ให้บริการ
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## การโหลดและเขียนการกำหนดค่า

ควรใช้การกำหนดค่าที่ถูกส่งเข้ามาแล้วในเส้นทางการเรียกที่กำลังทำงานอยู่ เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` ใน callback ของช่องทาง/ผู้ให้บริการ วิธีนี้ทำให้ snapshot ของกระบวนการเดียวไหลผ่านงาน แทนที่จะ parse การกำหนดค่าซ้ำใน hot path

ใช้ `api.runtime.config.current()` เฉพาะเมื่อ handler ที่มีอายุยาวต้องการ snapshot ของกระบวนการปัจจุบัน และไม่มีการส่งการกำหนดค่าเข้ามายังฟังก์ชันนั้น ค่าที่คืนกลับมาเป็น readonly; ให้ clone หรือใช้ตัวช่วย mutation ก่อนแก้ไข

factory ของเครื่องมือจะได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายใน callback `execute` ของเครื่องมือที่มีอายุยาวเมื่อการกำหนดค่าอาจเปลี่ยนหลังจากสร้างคำจำกัดความของเครื่องมือแล้ว

บันทึกการเปลี่ยนแปลงด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` ที่ชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัวตัดสินการ reload ของ gateway เป็นผู้ตัดสินใจ
- `afterWrite: { mode: "restart", reason: "..." }` บังคับให้ restart อย่างสะอาดเมื่อผู้เขียนรู้ว่า hot reload ไม่ปลอดภัย
- `afterWrite: { mode: "none", reason: "..." }` ระงับการ reload/restart อัตโนมัติเฉพาะเมื่อผู้เรียกเป็นเจ้าของงานติดตามผลเอง

ตัวช่วย mutation จะคืนค่า `afterWrite` พร้อมสรุป `followUp` แบบมี type เพื่อให้ผู้เรียกสามารถ log หรือทดสอบได้ว่าพวกเขาขอ restart หรือไม่ Gateway ยังเป็นเจ้าของว่า restart นั้นจะเกิดขึ้นจริงเมื่อใด

`api.runtime.config.loadConfig()` และ `api.runtime.config.writeConfigFile(...)` เป็นตัวช่วยความเข้ากันได้ที่เลิกใช้แล้วภายใต้ `runtime-config-load-write` ตัวช่วยเหล่านี้เตือนหนึ่งครั้งใน runtime และยังคงพร้อมใช้สำหรับ plugin ภายนอกเก่าระหว่างช่วง migration plugin ที่ bundled ต้องไม่ใช้ตัวช่วยเหล่านี้; guard ขอบเขตการกำหนดค่าจะล้มเหลวหากโค้ด plugin เรียกใช้หรือ import ตัวช่วยเหล่านี้จาก subpath ของ plugin SDK

สำหรับการ import SDK โดยตรง ให้ใช้ subpath การกำหนดค่าแบบเฉพาะเจาะจงแทน barrel ความเข้ากันได้แบบกว้าง
`openclaw/plugin-sdk/config-runtime`: `config-contracts` สำหรับ
type, `plugin-config-runtime` สำหรับ assertion ของการกำหนดค่าที่โหลดแล้วและการค้นหา entry ของ plugin,
`runtime-config-snapshot` สำหรับ snapshot ของกระบวนการปัจจุบัน และ
`config-mutation` สำหรับการเขียน การทดสอบ plugin ที่ bundled ควร mock subpath เฉพาะเจาะจงเหล่านี้โดยตรง แทนการ mock barrel ความเข้ากันได้แบบกว้าง

โค้ด runtime ภายในของ OpenClaw มีทิศทางเดียวกัน: โหลดการกำหนดค่าหนึ่งครั้งที่ CLI, gateway หรือขอบเขตกระบวนการ แล้วส่งค่านั้นต่อไป การเขียน mutation ที่สำเร็จจะ refresh snapshot runtime ของกระบวนการและเพิ่ม revision ภายใน; cache ที่มีอายุยาวควรอิง key จาก cache key ที่ runtime เป็นเจ้าของ แทนการ serialize การกำหนดค่าในเครื่องเอง โมดูล runtime ที่มีอายุยาวมี scanner แบบไม่ยอมให้มีการเรียก `loadConfig()` แบบ ambient; ใช้ `cfg` ที่ถูกส่งเข้ามา, request `context.getRuntimeConfig()` หรือ `getRuntimeConfig()` ที่ขอบเขตกระบวนการอย่างชัดเจน

เส้นทางการทำงานของผู้ให้บริการและช่องทางต้องใช้ snapshot การกำหนดค่า runtime ที่กำลังทำงานอยู่ ไม่ใช่ snapshot ไฟล์ที่คืนมาเพื่ออ่านกลับหรือแก้ไขการกำหนดค่า snapshot ไฟล์จะคงค่าต้นทาง เช่น marker SecretRef สำหรับ UI และการเขียน; callback ของผู้ให้บริการต้องการมุมมอง runtime ที่ resolve แล้ว เมื่อ helper อาจถูกเรียกด้วย snapshot ต้นทางที่กำลังทำงานอยู่หรือ snapshot runtime ที่กำลังทำงานอยู่ ให้ route ผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่านข้อมูลประจำตัว

## ยูทิลิตี runtime ที่นำกลับมาใช้ซ้ำได้

ใช้ข้อเท็จจริง `botLoopProtection` ขาเข้าสำหรับข้อความขาเข้าที่บอทเป็นผู้เขียน Core ใช้ guard sliding-window ในหน่วยความจำร่วมกันก่อนบันทึก session และ dispatch โดยไม่ผูกนโยบายกับช่องทางเดียว guard ติดตาม key `(scopeId, conversationId, participant pair)`, นับทั้งสองทิศทางของคู่ร่วมกัน, ใช้ cooldown เมื่อใช้งบประมาณของ window เกิน และ prune entry ที่ไม่ทำงานแล้วตามโอกาส

plugin ช่องทางที่เปิดเผยพฤติกรรมนี้ให้ operator ควรใช้ shape `channels.defaults.botLoopProtection` ร่วมกันสำหรับงบประมาณพื้นฐานก่อน แล้วค่อยซ้อน override เฉพาะช่องทาง/ผู้ให้บริการไว้ด้านบน การกำหนดค่าร่วมใช้หน่วยวินาทีเพราะเป็นส่วนที่ผู้ใช้เห็น:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

ส่งข้อเท็จจริง bot-pair ที่ normalize แล้วไปกับ turn ที่ resolve แล้ว Core จะ resolve ค่า default, การแปลงหน่วย และ semantics ของ `enabled`:

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
event loop แบบสองฝ่ายที่กำหนดเองซึ่งไม่ได้ผ่าน runner การตอบกลับขาเข้าร่วมกัน

## namespace ของ runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    ข้อมูลประจำตัว agent, ไดเรกทอรี และการจัดการ session

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

    `runEmbeddedAgent(...)` เป็นตัวช่วยกลางสำหรับเริ่ม turn ของ agent OpenClaw ปกติจากโค้ด plugin โดยใช้การ resolve ผู้ให้บริการ/โมเดลและการเลือก agent-harness แบบเดียวกับ reply ที่ถูก trigger โดยช่องทาง

    `runEmbeddedPiAgent(...)` ยังคงอยู่ในฐานะ alias ความเข้ากันได้ที่เลิกใช้แล้วสำหรับ plugin ที่มีอยู่ โค้ดใหม่ควรใช้ `runEmbeddedAgent(...)`

    `resolveThinkingPolicy(...)` คืนระดับ thinking ที่ผู้ให้บริการ/โมเดลรองรับและค่า default แบบไม่บังคับ plugin ผู้ให้บริการเป็นเจ้าของ profile เฉพาะโมเดลผ่าน hook thinking ของตน ดังนั้น plugin เครื่องมือควรเรียก helper runtime นี้แทนการ import หรือทำซ้ำรายการผู้ให้บริการ

    `normalizeThinkingLevel(...)` แปลงข้อความผู้ใช้ เช่น `on`, `x-high` หรือ `extra high` เป็นระดับที่จัดเก็บแบบ canonical ก่อนตรวจสอบกับ policy ที่ resolve แล้ว

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
    ```

    ควรใช้ `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` สำหรับ workflow ของ session ตัวช่วยเหล่านี้อ้างอิง session ด้วยข้อมูลประจำตัว agent/session เพื่อให้ plugin ไม่ต้องพึ่งพา shape การจัดเก็บ legacy `sessions.json` ใช้ `preserveActivity: true` สำหรับ patch เฉพาะ metadata ที่ไม่ควร refresh กิจกรรมของ session และใช้ `replaceEntry: true` เฉพาะเมื่อ callback คืน entry ที่สมบูรณ์และ field ที่ถูกลบต้องคงสถานะถูกลบไว้

    สำหรับการอ่านและเขียน transcript ให้ import `openclaw/plugin-sdk/session-transcript-runtime` และใช้ `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` หรือ `withSessionTranscriptWriteLock(...)` พร้อม `{ agentId, sessionKey, sessionId }` API เหล่านี้ช่วยให้ plugin ระบุ transcript, อ่าน event, append message, publish update และรัน operation ที่เกี่ยวข้องภายใต้ write lock ของ transcript เดียวกัน การส่ง `sessionFile`, การใช้ `resolveSessionTranscriptLegacyFileTarget(...)` หรือการ import low-level `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` จาก `openclaw/plugin-sdk/agent-harness-runtime` เลิกใช้แล้ว; path เหล่านั้นมีอยู่เฉพาะสำหรับโค้ด legacy ที่ได้รับ artifact transcript ที่ active อยู่แล้วเท่านั้น

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` และ `resolveAndPersistSessionFile(...)` เป็นตัวช่วยความเข้ากันได้ที่เลิกใช้แล้วสำหรับ plugin ที่ยังคงตั้งใจพึ่งพา whole-store legacy หรือ shape แบบ transcript-file โค้ด plugin ใหม่ต้องไม่ใช้ตัวช่วยเหล่านี้ และผู้เรียกที่มีอยู่ควร migrate ไปใช้ entry helper และ transcript identity helper

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่ default ของโมเดลและผู้ให้บริการ:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    รัน text completion ที่โฮสต์เป็นเจ้าของโดยไม่ import ส่วนภายในของผู้ให้บริการหรือ
    ทำซ้ำการเตรียมโมเดล/auth/base URL ของ OpenClaw

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    helper ใช้เส้นทางการเตรียม simple-completion แบบเดียวกับ runtime ในตัวของ OpenClaw
    และ snapshot การกำหนดค่า runtime ที่โฮสต์เป็นเจ้าของ engine บริบท
    ได้รับ capability `llm.complete` ที่ผูกกับ session ดังนั้นการเรียกโมเดลจะใช้
    agent ของ session ที่ active และไม่ fallback ไปยัง agent default อย่างเงียบ ๆ
    ผลลัพธ์ประกอบด้วย attribution ของผู้ให้บริการ/โมเดล/agent พร้อมการใช้งาน token,
    cache และค่าใช้จ่ายประมาณการที่ normalize แล้วเมื่อมี

    <Warning>
    การ override โมเดลต้องให้ operator opt-in ผ่าน `plugins.entries.<id>.llm.allowModelOverride: true` ในการกำหนดค่า ใช้ `plugins.entries.<id>.llm.allowedModels` เพื่อจำกัด plugin ที่เชื่อถือได้ให้อยู่กับ target `provider/model` แบบ canonical ที่ระบุ การ completion ข้าม agent ต้องใช้ `plugins.entries.<id>.llm.allowAgentIdOverride: true`
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
    การแทนที่โมเดล (`provider`/`model`) ต้องให้ผู้ปฏิบัติงานเลือกใช้ผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ในการกำหนดค่า Plugin ที่ไม่น่าเชื่อถือยังคงเรียกใช้ subagent ได้ แต่คำขอแทนที่จะถูกปฏิเสธ
    </Warning>

    `deleteSession(...)` สามารถลบเซสชันที่สร้างโดย Plugin เดียวกันผ่าน `api.runtime.subagent.run(...)` ได้ การลบเซสชันของผู้ใช้หรือผู้ปฏิบัติงานตามอำเภอใจยังคงต้องใช้คำขอ Gateway ที่มีขอบเขตผู้ดูแลระบบ

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการโหนดที่เชื่อมต่ออยู่และเรียกใช้คำสั่งโฮสต์โหนดจากโค้ด Plugin ที่โหลดโดย Gateway หรือจากคำสั่ง CLI ของ Plugin ใช้สิ่งนี้เมื่อ Plugin เป็นเจ้าของงานในเครื่องบนอุปกรณ์ที่จับคู่ไว้ เช่น บริดจ์เบราว์เซอร์หรือเสียงบน Mac อีกเครื่องหนึ่ง

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    ภายใน Gateway รันไทม์นี้อยู่ในกระบวนการเดียวกัน ในคำสั่ง CLI ของ Plugin รันไทม์จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งอย่าง `openclaw googlemeet recover-tab` จึงตรวจสอบโหนดที่จับคู่ไว้จากเทอร์มินัลได้ คำสั่ง Node ยังคงผ่านการจับคู่โหนด Gateway ตามปกติ, รายการอนุญาตคำสั่ง, นโยบาย node-invoke ของ Plugin และการจัดการคำสั่งภายในโหนด

    Plugin ที่เปิดเผยคำสั่งโฮสต์โหนดที่เป็นอันตรายควรลงทะเบียนนโยบาย node-invoke ด้วย `api.registerNodeInvokePolicy(...)` นโยบายจะทำงานใน Gateway หลังจากตรวจสอบรายการอนุญาตคำสั่งและก่อนส่งต่อคำสั่งไปยังโหนด ดังนั้นการเรียก `node.invoke` โดยตรงและเครื่องมือ Plugin ระดับสูงกว่าจะแชร์เส้นทางการบังคับใช้นโยบายเดียวกัน

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    ผูกรันไทม์ Task Flow เข้ากับคีย์เซสชัน OpenClaw ที่มีอยู่หรือบริบทเครื่องมือที่เชื่อถือได้ จากนั้นสร้างและจัดการ Task Flows โดยไม่ต้องส่งเจ้าของในทุกการเรียก

    Task Flow ติดตามสถานะเวิร์กโฟลว์หลายขั้นตอนแบบคงทน นี่ไม่ใช่ตัวจัดกำหนดการ:
    ใช้ Cron หรือ `api.session.workflow.scheduleSessionTurn(...)` สำหรับการปลุกในอนาคต
    จากนั้นใช้ `managedFlows` จากเทิร์นที่จัดกำหนดการไว้เมื่องานนั้น
    ต้องการสถานะโฟลว์ งานย่อย การรอ หรือการยกเลิก

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

    ใช้การกำหนดค่า `messages.tts` ของคอร์และการเลือกผู้ให้บริการ ส่งคืนบัฟเฟอร์เสียง PCM + อัตราสุ่มตัวอย่าง

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
    `api.runtime.stt.transcribeAudioFile(...)` ยังคงเป็นนามแฝงความเข้ากันได้สำหรับ `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`
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
    การกำหนดค่าที่ถูกส่งเข้ามาในเส้นทางการเรียกที่กำลังทำงานอยู่แล้ว ใช้
    `current()` เฉพาะเมื่อ handler ต้องการสแนปช็อตของกระบวนการโดยตรง

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
    ซึ่งบันทึกเจตนาของผู้เขียนโดยไม่ดึงการควบคุมการรีสตาร์ทออกจาก
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

    `runCommandWithTimeout(...)` ส่งคืน `stdout` และ `stderr` ที่จับไว้ จำนวน
    การตัดทอนที่เป็นทางเลือก, `code`, `signal`, `killed`, `termination` และ
    `noOutputTimedOut` ผลลัพธ์ timeout และ no-output-timeout จะรายงาน `code: 124`
    เมื่อกระบวนการลูกไม่ได้ให้รหัสออกที่ไม่ใช่ศูนย์ การออกด้วยสัญญาณที่ไม่ใช่ timeout
    ยังสามารถส่งคืน `code: null` ได้ ดังนั้นให้ใช้ `termination` และ
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
    การแก้ไขไดเรกทอรีสถานะและที่เก็บข้อมูลแบบคีย์ที่รองรับด้วย SQLite

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

    ที่เก็บแบบมีคีย์จะอยู่รอดหลังรีสตาร์ตและแยกขอบเขตตาม id ของ Plugin ที่ผูกกับรันไทม์ ใช้ `registerIfAbsent(...)` สำหรับการเคลมแบบ atomic dedupe: จะคืนค่า `true` เมื่อคีย์หายไปหรือหมดอายุแล้วถูกลงทะเบียน หรือ `false` เมื่อมีค่าสดอยู่แล้วโดยไม่เขียนทับค่า เวลา创建 หรือ TTL ข้อจำกัด: `maxEntries` ต่อเนมสเปซ, แถวสด 6,000 แถวต่อ Plugin, ค่า JSON ต่ำกว่า 64KB และการหมดอายุ TTL แบบเลือกได้ เมื่อการเขียนจะเกินเพดานแถวของ Plugin รันไทม์อาจขับแถวสดที่เก่าที่สุดออกจากเนมสเปซที่กำลังถูกเขียน เนมสเปซพี่น้องจะไม่ถูกขับออกสำหรับการเขียนนั้น และการเขียนยังคงล้มเหลวหากเนมสเปซไม่สามารถปล่อยแถวได้เพียงพอ

    <Warning>
    รองรับเฉพาะ Plugin แบบบันเดิลในรุ่นนี้เท่านั้น
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
    ตัวช่วยรันไทม์เฉพาะช่องทาง (ใช้ได้เมื่อโหลด Plugin ช่องทางแล้ว)

    `api.runtime.channel.media` คือพื้นผิวที่แนะนำสำหรับการดาวน์โหลดและจัดเก็บสื่อของช่องทาง:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    ใช้ `saveRemoteMedia(...)` เมื่อ URL ระยะไกลควรถูกแปลงเป็นสื่อของ OpenClaw ใช้ `saveResponseMedia(...)` เมื่อ Plugin ดึง `Response` มาแล้วพร้อมการจัดการ auth, redirect หรือ allowlist ที่ Plugin เป็นเจ้าของ ใช้ `readRemoteMediaBuffer(...)` เฉพาะเมื่อ Plugin ต้องการไบต์ดิบสำหรับการตรวจสอบ การแปลง การถอดรหัส หรือการอัปโหลดซ้ำ `fetchRemoteMedia(...)` ยังคงเป็นนามแฝงความเข้ากันได้ที่เลิกใช้แล้วสำหรับ `readRemoteMediaBuffer(...)`

    `api.runtime.channel.mentions` คือพื้นผิวนโยบายการกล่าวถึงขาเข้าร่วมกันสำหรับ Plugin ช่องทางแบบบันเดิลที่ใช้การฉีดรันไทม์:

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

    ตัวช่วยการกล่าวถึงที่มีให้:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` ตั้งใจไม่เปิดเผยตัวช่วยความเข้ากันได้ `resolveMentionGating*` แบบเก่า ควรใช้เส้นทาง `{ facts, policy }` ที่ทำให้เป็นรูปแบบมาตรฐานแล้ว

  </Accordion>
</AccordionGroup>

## การจัดเก็บข้อมูลอ้างอิงรันไทม์

ใช้ `createPluginRuntimeStore` เพื่อจัดเก็บข้อมูลอ้างอิงรันไทม์สำหรับใช้นอกคอลแบ็ก `register`:

<Steps>
  <Step title="สร้างที่เก็บ">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="เชื่อมเข้ากับจุดเข้า">
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
ควรใช้ `pluginId` สำหรับตัวตนของ runtime-store รูปแบบ `key` ระดับต่ำกว่าสำหรับกรณีที่ไม่พบบ่อย ซึ่ง Plugin หนึ่งตั้งใจต้องการช่องรันไทม์มากกว่าหนึ่งช่อง
</Note>

## ฟิลด์ `api` ระดับบนอื่นๆ

นอกเหนือจาก `api.runtime` อ็อบเจกต์ API ยังมี:

<ParamField path="api.id" type="string">
  id ของ Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  สแนปช็อตการกำหนดค่าปัจจุบัน (สแนปช็อตรันไทม์ในหน่วยความจำที่ใช้งานอยู่เมื่อมี)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  การกำหนดค่าเฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  ตัวบันทึกที่จำกัดขอบเขต (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน; `"setup-runtime"` คือหน้าต่างเริ่มต้น/ตั้งค่าแบบเบาก่อนเข้ารายการเต็ม
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  แปลงพาธโดยอิงจากรูทของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [ภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและรีจิสทรี
- [จุดเข้าของ SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — ข้อมูลอ้างอิง subpath
