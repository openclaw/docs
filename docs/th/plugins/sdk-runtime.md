---
read_when:
    - คุณต้องเรียกใช้ตัวช่วยหลักจาก Plugin (TTS, STT, การสร้างภาพ, การค้นหาเว็บ, Gateway, เอเจนต์ย่อย, Node)
    - คุณต้องการทำความเข้าใจว่า api.runtime เปิดเผยอะไรบ้าง
    - คุณกำลังเข้าถึงตัวช่วยด้านการกำหนดค่า เอเจนต์ หรือสื่อจากโค้ด Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- ตัวช่วยรันไทม์ที่ฉีดเข้ามาและพร้อมใช้งานสำหรับ Plugin
title: ตัวช่วยรันไทม์ของ Plugin
x-i18n:
    generated_at: "2026-07-20T06:05:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 197ccf047ccefddbd515ace9f1ce195e998f3fbafcb65ee80282bf67f0c6ab8d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

ข้อมูลอ้างอิงสำหรับออบเจ็กต์ `api.runtime` ที่แทรกลงในทุก Plugin ระหว่างการลงทะเบียน ใช้ตัวช่วยเหล่านี้แทนการนำเข้าส่วนภายในของโฮสต์โดยตรง

<CardGroup cols={2}>
  <Card title="Plugin ช่องทาง" href="/th/plugins/sdk-channel-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทของ Plugin ช่องทาง
  </Card>
  <Card title="Plugin ผู้ให้บริการ" href="/th/plugins/sdk-provider-plugins">
    คู่มือทีละขั้นตอนที่ใช้ตัวช่วยเหล่านี้ในบริบทของ Plugin ผู้ให้บริการ
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` คือเวอร์ชันผลิตภัณฑ์ OpenClaw ปัจจุบัน ซึ่งมาจากตัวแก้ไขเวอร์ชันที่ใช้ร่วมกัน เพื่อให้ Plugin เห็นค่าเดียวกับที่ CLI รายงาน

## การโหลดและการเขียนการกำหนดค่า

ควรใช้การกำหนดค่าที่ส่งเข้ามาในเส้นทางการเรียกที่กำลังทำงานอยู่แล้ว เช่น `api.config` ระหว่างการลงทะเบียน หรืออาร์กิวเมนต์ `cfg` ในคอลแบ็กของช่องทาง/ผู้ให้บริการ วิธีนี้ทำให้สแนปช็อตหนึ่งชุดของกระบวนการไหลผ่านงาน แทนที่จะแยกวิเคราะห์การกำหนดค่าใหม่ในเส้นทางที่ใช้งานบ่อย

ใช้ `api.runtime.config.current()` เฉพาะเมื่อแฮนด์เลอร์ที่ทำงานระยะยาวต้องการสแนปช็อตปัจจุบันของกระบวนการ และไม่มีการส่งการกำหนดค่าไปยังฟังก์ชันนั้น ค่าที่คืนมาเป็นแบบอ่านอย่างเดียว ให้โคลนหรือใช้ตัวช่วยแก้ไขค่าก่อนแก้ไข

แฟกทอรีเครื่องมือจะได้รับ `ctx.runtimeConfig` พร้อมกับ `ctx.getRuntimeConfig()` ใช้ getter ภายในคอลแบ็ก `execute` ของเครื่องมือที่ทำงานระยะยาว เมื่อการกำหนดค่าสามารถเปลี่ยนแปลงได้หลังจากสร้างนิยามเครื่องมือแล้ว

บันทึกการเปลี่ยนแปลงด้วย `api.runtime.config.mutateConfigFile(...)` หรือ `api.runtime.config.replaceConfigFile(...)` การเขียนแต่ละครั้งต้องเลือกนโยบาย `afterWrite` อย่างชัดเจน:

- `afterWrite: { mode: "auto" }` ให้ตัววางแผนโหลดใหม่ของ Gateway เป็นผู้ตัดสินใจ
- `afterWrite: { mode: "restart", reason: "..." }` บังคับให้เริ่มต้นใหม่อย่างสมบูรณ์ เมื่อผู้เขียนทราบว่าการโหลดใหม่ขณะทำงานไม่ปลอดภัย
- `afterWrite: { mode: "none", reason: "..." }` ระงับการโหลดใหม่/เริ่มต้นใหม่โดยอัตโนมัติ เฉพาะเมื่อผู้เรียกเป็นผู้รับผิดชอบการดำเนินการต่อเนื่อง

ตัวช่วยแก้ไขค่าจะคืน `afterWrite` พร้อมข้อมูลสรุป `followUp` ที่มีชนิดข้อมูลกำกับ เพื่อให้ผู้เรียกบันทึกหรือตรวจสอบได้ว่ามีการร้องขอให้เริ่มต้นใหม่หรือไม่ Gateway ยังคงเป็นผู้ควบคุมว่าการเริ่มต้นใหม่นั้นจะเกิดขึ้นจริงเมื่อใด

ใช้ `current()`, `cfg` ที่ส่งเข้ามา, `mutateConfigFile(...)` หรือ
`replaceConfigFile(...)` สำหรับการเข้าถึงและเขียนการกำหนดค่าขณะทำงาน

สำหรับการนำเข้า SDK โดยตรง ควรใช้เส้นทางย่อยการกำหนดค่าที่เฉพาะเจาะจงแทน barrel ความเข้ากันได้ `openclaw/plugin-sdk/config-runtime` แบบกว้าง ได้แก่ `config-contracts` สำหรับชนิดข้อมูล, `runtime-config-snapshot` สำหรับสแนปช็อตกระบวนการปัจจุบัน และ `config-mutation` สำหรับการเขียน อ่านค่าที่จำกัดขอบเขตตามรายการจาก `api.pluginConfig`; ใช้บริบทเครื่องมือที่ให้มาเฉพาะสำหรับสแนปช็อตการกำหนดค่าทั่วทั้งรันไทม์ และคงการผสานข้อมูลเฉพาะ Plugin ไว้ที่ขอบเขตนั้น การทดสอบ Plugin ที่รวมมาในชุดควรจำลองเส้นทางย่อยที่เฉพาะเจาะจงเหล่านี้โดยตรง แทนการจำลอง barrel ความเข้ากันได้แบบกว้าง

โค้ดรันไทม์ภายในของ OpenClaw ใช้แนวทางเดียวกัน คือโหลดการกำหนดค่าหนึ่งครั้งที่ขอบเขตของ CLI, Gateway หรือกระบวนการ แล้วส่งค่านั้นต่อไป การเขียนการแก้ไขค่าที่สำเร็จจะรีเฟรชสแนปช็อตรันไทม์ของกระบวนการและเพิ่มรีวิชันภายใน แคชที่ทำงานระยะยาวควรใช้คีย์แคชที่รันไทม์เป็นเจ้าของ แทนการซีเรียลไลซ์การกำหนดค่าไว้ภายใน โมดูลรันไทม์ที่ทำงานระยะยาวมีตัวสแกนแบบไม่ยอมรับเลยสำหรับการเรียก `loadConfig()` จากสภาพแวดล้อมโดยรอบ ให้ใช้ `cfg` ที่ส่งเข้ามา, `context.getRuntimeConfig()` ของคำขอ หรือ `getRuntimeConfig()` ที่ขอบเขตกระบวนการอย่างชัดเจน

เส้นทางการทำงานของผู้ให้บริการและช่องทางต้องใช้สแนปช็อตการกำหนดค่ารันไทม์ที่กำลังใช้งาน ไม่ใช่สแนปช็อตไฟล์ที่คืนมาเพื่ออ่านกลับหรือแก้ไขการกำหนดค่า สแนปช็อตไฟล์จะเก็บค่าต้นฉบับ เช่น เครื่องหมาย SecretRef สำหรับ UI และการเขียน ส่วนคอลแบ็กของผู้ให้บริการต้องใช้มุมมองรันไทม์ที่แก้ไขค่าแล้ว เมื่อตัวช่วยอาจถูกเรียกด้วยสแนปช็อตต้นฉบับที่กำลังใช้งานหรือสแนปช็อตรันไทม์ที่กำลังใช้งาน ให้ส่งผ่าน `selectApplicableRuntimeConfig()` ก่อนอ่านข้อมูลประจำตัว

## ยูทิลิตีรันไทม์ที่ใช้ซ้ำได้

ใช้ข้อเท็จจริง `botLoopProtection` ขาเข้าสำหรับข้อความขาเข้าที่บอตเป็นผู้เขียน Core จะใช้กลไกป้องกันแบบหน้าต่างเลื่อนในหน่วยความจำที่ใช้ร่วมกัน ก่อนบันทึกเซสชันและส่งต่อ โดยไม่ผูกนโยบายไว้กับช่องทางใดช่องทางหนึ่ง กลไกป้องกันจะติดตามคีย์ `(scopeId, conversationId, participant pair)`, นับทั้งสองทิศทางของคู่ร่วมกัน, ใช้ช่วงพักเมื่อเกินงบประมาณของหน้าต่าง และตัดรายการที่ไม่มีการใช้งานออกตามโอกาส

Plugin ช่องทางที่เปิดเผยลักษณะการทำงานนี้แก่ผู้ปฏิบัติงานควรใช้รูปแบบ `channels.defaults.botLoopProtection` ที่ใช้ร่วมกันสำหรับงบประมาณพื้นฐานก่อน แล้วจึงซ้อนทับค่าที่ปรับเฉพาะช่องทาง/ผู้ให้บริการ การกำหนดค่าที่ใช้ร่วมกันใช้หน่วยวินาทีเนื่องจากเป็นข้อมูลที่แสดงต่อผู้ใช้:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

ส่งข้อเท็จจริงของคู่บอตที่ปรับให้เป็นมาตรฐานแล้วพร้อมกับเทิร์นที่แก้ไขแล้ว Core จะจัดการค่าเริ่มต้น การแปลงหน่วย และความหมายของ `enabled`:

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

ใช้ `openclaw/plugin-sdk/pair-loop-guard-runtime` โดยตรงเฉพาะสำหรับลูปเหตุการณ์แบบ
สองฝ่ายที่กำหนดเอง ซึ่งไม่ได้ผ่านตัวรันการตอบกลับขาเข้าที่ใช้ร่วมกัน

## เนมสเปซรันไทม์

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    ข้อมูลประจำตัวของเอเจนต์ ไดเรกทอรี และการจัดการเซสชัน

    ```typescript
    // แก้ไขไดเรกทอรีทำงานของเอเจนต์ (ต้องระบุ agentId)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // แก้ไขพื้นที่ทำงานของเอเจนต์
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // รับข้อมูลประจำตัวของเอเจนต์
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // รับระดับการคิดเริ่มต้น
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // ตรวจสอบระดับการคิดที่ผู้ใช้ระบุเทียบกับโปรไฟล์ผู้ให้บริการที่กำลังใช้งาน
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // ส่ง level ไปยังการทำงานแบบฝังตัว
    }

    // รับเวลาหมดเวลาของเอเจนต์
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // ตรวจสอบให้แน่ใจว่าพื้นที่ทำงานมีอยู่
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // เรียกใช้เทิร์นของเอเจนต์แบบฝังตัว
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "สรุปการเปลี่ยนแปลงล่าสุด",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` คือตัวช่วยที่เป็นกลางสำหรับเริ่มต้นเทิร์นเอเจนต์ OpenClaw ตามปกติจากโค้ด Plugin โดยใช้การแก้ไขผู้ให้บริการ/โมเดลและการเลือกชุดควบคุมเอเจนต์แบบเดียวกับการตอบกลับที่ทริกเกอร์โดยช่องทาง

    `runEmbeddedPiAgent(...)` ยังคงอยู่ในฐานะนามแฝงความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับ Plugin ที่มีอยู่ โค้ดใหม่ควรใช้ `runEmbeddedAgent(...)`

    `resolveCliBackendDispatchEligibility({ provider, model, agentId, authProfileId, config, agentDir, workspaceDir })` แบ่งปันการตัดสินใจส่งต่อไปยังแบ็กเอนด์ CLI ของตัวรันแบบฝังตัว (เส้นทาง, ความสามารถ `subscriptionAuthDispatch` ที่แบ็กเอนด์ประกาศ, โหมดข้อมูลประจำตัวที่จัดเก็บไว้ โดยเคารพ `authProfileId` ที่ตรึงไว้อย่างชัดเจน) กับผู้เรียกที่เลือกให้การทำงานแบบฝังตัวใช้ `cliBackendDispatch: "subscription-auth"` โดยจะคืน `{ provider }` เมื่อการทำงานจะดำเนินการผ่านแบ็กเอนด์ CLI และคืน `undefined` เมื่อยังคงใช้การส่งผ่านโดยตรง เพื่อให้ผู้เรียกจัดสรรเวลาหมดเวลาสำหรับการทำงานที่จะเกิดขึ้นจริงได้

    `resolveThinkingPolicy(...)` คืนระดับการคิดที่ผู้ให้บริการ/โมเดลรองรับและค่าเริ่มต้นที่อาจมี Plugin ผู้ให้บริการเป็นเจ้าของโปรไฟล์เฉพาะโมเดลผ่านฮุกการคิด ดังนั้น Plugin เครื่องมือควรเรียกตัวช่วยรันไทม์นี้แทนการนำเข้าหรือทำซ้ำรายการของผู้ให้บริการ

    `normalizeThinkingLevel(...)` แปลงข้อความผู้ใช้ เช่น `on`, `x-high` หรือ `extra high` เป็นระดับมาตรฐานที่จัดเก็บไว้ ก่อนตรวจสอบกับนโยบายที่แก้ไขแล้ว

    **ตัวช่วยที่เก็บเซสชัน** อยู่ภายใต้ `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // วนซ้ำแถวเซสชันโดยไม่ขึ้นกับรูปแบบ sessions.json แบบเดิม
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // สร้างหรืออัปเดตเซสชัน แล้วส่ง signal ไปยังการทำงานของเอเจนต์ที่ได้รับอนุญาต
      },
    );
    ```

    ควรใช้ `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` สำหรับเวิร์กโฟลว์เซสชัน ตัวช่วยเหล่านี้ระบุเซสชันด้วยข้อมูลประจำตัวของเอเจนต์/เซสชัน เพื่อให้ Plugin ไม่ต้องขึ้นกับรูปแบบการจัดเก็บ `sessions.json` แบบเดิม ใช้ `preserveActivity: true` สำหรับแพตช์เฉพาะข้อมูลเมตาที่ไม่ควรรีเฟรชกิจกรรมของเซสชัน และใช้ `replaceEntry: true` เฉพาะเมื่อคอลแบ็กคืนรายการที่สมบูรณ์และฟิลด์ที่ลบต้องยังคงถูกลบ เส้นทาง Doctor และการย้ายข้อมูลสามารถรวม `fallbackEntry`, `skipMaintenance` และ `requireWriteSuccess` เพื่อซ่อมแซมที่เก็บมาตรฐานแบบอะตอมมิกครั้งเดียว

    `createSessionEntry(...)` สร้างแถวเซสชันและทรานสคริปต์มาตรฐานใหม่ พื้นผิว `initialEntry` ที่เชื่อถือได้ถูกจำกัดขอบเขตโดยเจตนา ได้แก่ `agentHarnessId` ที่ไม่ว่าง, `modelSelectionLocked: true` ที่เป็นตัวเลือก และ `pluginExtensions` ที่เป็นตัวเลือก รันไทม์ที่แทรกเข้ามายอมรับเฉพาะ ID ของชุดควบคุมที่ Plugin ผู้เรียกเป็นเจ้าของผ่าน `registerAgentHarness(...)`; นี่เป็นอินวาเรียนต์ด้านความเป็นเจ้าของ ไม่ใช่แซนด์บ็อกซ์ระหว่าง Plugin ภายในกระบวนการ ระบบจะปฏิเสธแถวที่มีอยู่แล้ว โดย `label` และ `spawnedCwd` เป็นฟิลด์การสร้างแยกต่างหาก ไม่ใช่แพตช์รายการที่เชื่อถือได้

    การสร้างจะถือรั้วการแก้ไขวงจรชีวิตเซสชันผ่าน `afterCreate` เพื่อให้งานใหม่รอจนการเริ่มต้นที่ Plugin เป็นเจ้าของเสร็จสิ้น และงานที่ได้รับอนุญาตซึ่งมีอยู่ก่อนหน้าจะทำให้การสร้างล้มเหลว คอลแบ็กจะได้รับสำเนาของสถานะที่สร้างขึ้น หากคืนแพตช์ แพตช์นั้นจะมีได้เฉพาะ `pluginExtensions` และค่าของมันคือฟิลด์ `pluginExtensions` สุดท้ายที่สมบูรณ์ ความล้มเหลวของคอลแบ็กหรือการบันทึกขั้นสุดท้ายจะย้อนกลับแถวใหม่และทรานสคริปต์ที่ยังไม่เปลี่ยนแปลง การย้อนกลับแบบมีการป้องกันจะรักษาแถวที่ถูกเปลี่ยนแปลงหรือถูกอ้างสิทธิ์พร้อมกันไว้ `recoverMatchingInitialEntry: true` ใช้เฉพาะสำหรับลองเริ่มต้นที่ถูกขัดจังหวะใหม่ เมื่อฟิลด์ที่เชื่อถือได้ซึ่งบันทึกไว้ตรงกันทุกประการ และการกู้คืนกำหนดให้ `afterCreate` คืนแพตช์สุดท้าย

    ใช้ `runWithWorkAdmission(...)` เมื่อ Plugin เริ่มทำงานกับเซสชันที่บันทึกไว้ คอลแบ็กจะปฏิเสธเซสชันที่เก็บถาวรหรือถูกแทนที่พร้อมกัน, ประสานการแก้ไขแบบเก็บถาวร/รีเซ็ต/ลบไว้จนเสร็จสิ้น และได้รับ `AbortSignal` ที่ต้องส่งต่อไปยังการทำงานของเอเจนต์ ชุดควบคุมอาจระบุผู้รับมอบหมายการดำเนินการที่เชื่อถือได้อย่างชัดเจนผ่านฟิลด์ลงทะเบียน `delegatedExecutionPluginIds` แบบทดลอง ผู้รับมอบหมายสามารถอนุญาตและเรียกใช้ได้เฉพาะเซสชันที่มีอยู่จริงซึ่งล็อกโมเดลไว้อย่างตรงกันเท่านั้น การแก้ไขเซสชันทั้งหมดยังคงจำกัดไว้สำหรับเจ้าของชุดควบคุม ดู [Plugin ชุดควบคุมเอเจนต์](/th/plugins/sdk-agent-harness#delegated-execution).

    ปลั๊กอินสำหรับการบำรุงรักษาและซ่อมแซมอาจใช้ `deleteSessionEntry(...)` สำหรับรายการเซสชันที่มีขอบเขตหนึ่งรายการ, `cleanupSessionLifecycleArtifacts(...)` สำหรับเซสชันชั่วคราวที่วงจรชีวิตเป็นผู้ดูแล และ `resolveSessionStoreBackupPaths(...)` ก่อนแก้ไขสโตร์ ส่ง `expectedSessionId` และ `expectedUpdatedAt` เมื่อการลบต้องไม่เกิดภาวะแข่งขันกับการอัปเดตเซสชันพร้อมกัน ใช้ `expectedSessionId: null` เมื่อสแนปช็อตก่อนหน้าไม่มี ID เซสชัน ตัวช่วยเหล่านี้เป็นพื้นผิวเฉพาะสำหรับการซ่อมแซม/วงจรชีวิต ไม่ใช่ API สำหรับลบสโตร์โดยทั่วไป

    `resolveStorePath(...)` และ `updateSessionStoreEntry(...)` ทำให้ชุดตัวช่วยเซสชันสมบูรณ์ยิ่งขึ้น โดย `resolveStorePath` จะแก้ไขพาธสโตร์เซสชันสำหรับขอบเขตที่กำหนด และ `updateSessionStoreEntry({ storePath, sessionKey, update })` จะแพตช์รายการหนึ่งโดยตรงผ่านพาธสโตร์เมื่อผู้เรียกทราบพาธอยู่แล้ว

    `loadTranscriptEventsSync(...)` พร้อมใช้งานสำหรับเส้นทาง doctor และการซ่อมแซมแบบซิงโครนัสที่ไม่สามารถใช้รันไทม์ทรานสคริปต์แบบอะซิงโครนัสได้ โดยจะคืนเรคคอร์ด `SessionStoreTranscriptEvent` แบบดิบ โค้ดรันไทม์ปลั๊กอินทั่วไปควรเลือกใช้ `openclaw/plugin-sdk/session-transcript-runtime`

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)` และ `sqliteSessionFileMarkerMatchesSession(...)` เป็นตัวช่วยชั่วคราวสำหรับโค้ดที่ยังคงได้รับฟิลด์แบบเก่าชื่อ `sessionFile` มาร์กเกอร์ SQLite ที่แยกวิเคราะห์แล้วระบุเป้าหมายทรานสคริปต์ SQLite ที่ใช้งานอยู่ ไม่ใช่พาธระบบไฟล์ API ใหม่ควรส่งผ่านอัตลักษณ์เซสชันที่มีชนิดแทนสตริงมาร์กเกอร์

    สำหรับการอ่านและเขียนทรานสคริปต์ ให้นำเข้า `openclaw/plugin-sdk/session-transcript-runtime` และใช้ `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readSessionTranscriptRawDelta(...)`, `readSessionTranscriptVisibleMessageDelta(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` หรือ `withSessionTranscriptWriteLock(...)` ร่วมกับ `{ agentId, sessionKey, sessionId }` API เหล่านี้ช่วยให้ปลั๊กอินระบุทรานสคริปต์ อ่านเหตุการณ์ดิบหรือรายการข้อความที่มองเห็นได้และปลอดภัยต่อสาขา ต่อท้ายข้อความ เผยแพร่การอัปเดต และดำเนินการที่เกี่ยวข้องภายใต้ล็อกการเขียนทรานสคริปต์เดียวกัน โดยไม่ต้องพึ่งพาพาธไฟล์ทรานสคริปต์ที่ใช้งานอยู่ `readVisibleSessionTranscriptMessageEntries(...)` คืนข้อมูลเมตาการอ่านตามลำดับ ฟิลด์ `seq` ของข้อมูลดังกล่าวไม่ใช่เคอร์เซอร์ที่ใช้ดำเนินการต่อได้

    `readSessionTranscriptRawDelta(...)` คืนผลลัพธ์ `page`, `reset` หรือ `missing` ที่มีขอบเขตจำกัด ส่ง `page.cursor` แบบทึบเข้าไปในการเรียกครั้งถัดไป การต่อท้ายเพียงอย่างเดียวจะคงเคอร์เซอร์ไว้ ส่วนการแทนที่ทรานสคริปต์จะคืน `reset` พร้อมเคอร์เซอร์เริ่มต้นระบบใหม่ โดยค่าเริ่มต้นแต่ละหน้ารองรับ 1,000 เหตุการณ์และข้อมูลที่ซีเรียลไลซ์แล้ว 1,000,000 ไบต์ ผู้เรียกอาจขอได้สูงสุด 10,000 เหตุการณ์และ 64 MiB เมื่อเหตุการณ์ถัดไปเพียงเหตุการณ์เดียวเกิน `maxBytes` หน้าจะว่างและรายงาน `requiredBytes` ให้ลองใหม่โดยใช้ขีดจำกัดไบต์อย่างน้อยเท่าค่านั้น เมื่อค่าไม่เกิน 64 MiB เหตุการณ์แต่ละรายการที่ใหญ่กว่านี้ต้องใช้ API สำหรับอ่านแบบสมบูรณ์ เคอร์เซอร์ระบุเฉพาะตำแหน่งและไม่เคยมอบสิทธิ์เข้าถึงเซสชันอื่น

    `readSessionTranscriptVisibleMessageDelta(...)` มีรูปแบบการเริ่มต้นระบบและดำเนินการต่อที่มีขอบเขตจำกัดแบบเดียวกันบนโปรเจกชันข้อความที่ใช้งานอยู่ซึ่งโฮสต์เป็นผู้ดูแล โดยจะคืนข้อความจากเก่าสุดไปใหม่สุด เพื่อให้กลไกบริบทระบายประวัติเริ่มต้นและบันทึกเคอร์เซอร์แบบทึบเป็นจุดอ้างอิงความคืบหน้าได้ จัดเก็บและคืนเคอร์เซอร์โดยไม่แก้ไข เคอร์เซอร์เป็นคำใบ้สำหรับการดำเนินการต่อ ไม่ใช่ข้อมูลประจำตัวสำหรับการอนุญาต การต่อท้ายแบบเชิงเส้นจะดำเนินการต่อหลังข้อความล่าสุดที่คืนมา การแทนที่ทรานสคริปต์ เคอร์เซอร์ที่จุดยึดออกจากหรือย้ายภายในสาขาที่ใช้งานอยู่ เคอร์เซอร์ที่มีรูปแบบไม่ถูกต้อง และเคอร์เซอร์ข้ามเซสชัน จะคืน `reset` พร้อมเคอร์เซอร์เริ่มต้นระบบใหม่ ค่าเริ่มต้นและขีดจำกัดสูงสุดของจำนวนและไบต์ตรงกับ API เดลตาดิบ ขณะที่โปรเจกชันที่ใช้งานอยู่กำลังสร้างใหม่หลังการเปลี่ยนสาขา ผลลัพธ์จะเป็น `unavailable` พร้อมเหตุผล `projection_rebuilding` ให้ลองใหม่ภายหลังแทนการย้อนกลับไปใช้ไฟล์ทรานสคริปต์ที่ใช้งานอยู่

    ตัวช่วยแบบเก่าสำหรับทั้งสโตร์และไฟล์ทรานสคริปต์ที่ใช้งานอยู่ไม่ถูกส่งออกจาก SDK ปลั๊กอินอีกต่อไป ใช้ตัวช่วยรายการที่มีขอบเขตสำหรับข้อมูลเมตาเซสชัน และใช้ตัวช่วยอัตลักษณ์ทรานสคริปต์สำหรับการดำเนินการกับทรานสคริปต์ที่ใช้งานอยู่ เวิร์กโฟลว์การเก็บถาวร/การสนับสนุนที่ต้องใช้สิ่งประดิษฐ์แบบไฟล์ควรใช้พื้นผิวเฉพาะสำหรับการเก็บถาวร แทน API รันไทม์เซสชันที่ใช้งานอยู่

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    ค่าคงที่ของโมเดลและผู้ให้บริการเริ่มต้น:

    ```typescript
    const model = api.runtime.agent.defaults.model; // เช่น "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // เช่น "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    เรียกใช้การเติมข้อความที่โฮสต์เป็นผู้ดูแลโดยไม่ต้องนำเข้ารายละเอียดภายในของผู้ให้บริการหรือ
    ทำซ้ำการเตรียมโมเดล/การตรวจสอบสิทธิ์/URL ฐานของ OpenClaw

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "สรุปทรานสคริปต์นี้" }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
      reasoning: "high",
    });
    ```

    การประสานงานผู้ให้บริการยังสามารถขอใช้วงจรชีวิตของบริการภายในเครื่อง
    ที่กำหนดค่าไว้ก่อนส่งคำขอ HTTP:

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // ส่งและอ่านคำขอของผู้ให้บริการจนเสร็จสมบูรณ์
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` เป็นสัญญา SDK สำหรับบริการผู้ให้บริการแบบทั่วไป
    ที่เสถียร โฮสต์จะแก้ไขการกำหนดค่ากระบวนการจาก
    `models.providers.<providerId>.localService` ผู้เรียกไม่สามารถระบุ
    คำสั่ง อาร์กิวเมนต์ สภาพแวดล้อม หรือนโยบายวงจรชีวิตได้ การสร้างกระบวนการ
    ความพร้อม การวินิจฉัย และนโยบายหยุดเมื่อไม่มีการใช้งานยังคงเป็นรายละเอียดภายในของโฮสต์

    ส่ง ID ผู้ให้บริการที่กำหนดค่าไว้อย่างตรงตัวและ URL ฐานของคำขอที่แก้ไขแล้ว ห้าม
    แทนที่นามแฝงด้วย ID อะแดปเตอร์ เพราะนามแฝงแต่ละรายการอาจชี้ไปยัง
    โฮสต์ GPU ภายในเครื่องคนละเครื่อง โฮสต์จะปฏิเสธปลายทางที่ไม่ตรงกับ URL ฐานของ
    ผู้ให้บริการที่กำหนดค่าไว้ ยกเว้นการปรับรูปแบบ `/v1` ที่อะแดปเตอร์ Ollama และ LM
    Studio ใช้ โฮสต์เป็นผู้ดูแลการจัดลำดับการเริ่มต้น การตรวจสอบความพร้อม
    การเช่าคำขอ การจัดการการยกเลิก และการปิดเมื่อไม่มีการใช้งาน

    ตัวช่วยนี้ใช้เส้นทางการเตรียมการเติมข้อความแบบง่ายเดียวกับรันไทม์
    ในตัวของ OpenClaw และสแนปช็อตการกำหนดค่ารันไทม์ที่โฮสต์เป็นผู้ดูแล กลไกบริบท
    จะได้รับความสามารถ `llm.complete` ที่ผูกกับเซสชัน เพื่อให้การเรียกโมเดลใช้
    เอเจนต์ของเซสชันที่ใช้งานอยู่และไม่ย้อนกลับไปใช้เอเจนต์เริ่มต้นโดยไม่แจ้ง
    ผลลัพธ์ประกอบด้วยการระบุผู้ให้บริการ/โมเดล/เอเจนต์ รวมถึงการใช้งานโทเค็น
    แคช และค่าใช้จ่ายโดยประมาณที่ปรับรูปแบบแล้วเมื่อมีข้อมูล

    ตั้งค่า `reasoning` เพื่อขอระดับความพยายามในการให้เหตุผลสำหรับโมเดลที่เลือก
    โฮสต์จะปรับระดับการคิดมาตรฐาน (`off`, `minimal`, `low`,
    `medium`, `high`, `xhigh`, `adaptive`, `max` และ `ultra`) ให้เหมาะกับ
    ผู้ให้บริการและโมเดลที่เลือกก่อนส่งการเติมข้อความ `adaptive` จะกลายเป็น
    `medium`; `max` และ `ultra` จะกลายเป็น `max` เมื่อรองรับ มิฉะนั้นจะเป็น `xhigh`

    <Warning>
    การแทนที่โมเดลต้องให้ผู้ดำเนินการเลือกเข้าร่วมผ่าน `plugins.entries.<id>.llm.allowModelOverride: true` ในการกำหนดค่า ใช้ `plugins.entries.<id>.llm.allowedModels` เพื่อจำกัดปลั๊กอินที่เชื่อถือได้ไว้เฉพาะเป้าหมาย `provider/model` มาตรฐานที่กำหนด การเติมข้อความข้ามเอเจนต์ต้องใช้ `plugins.entries.<id>.llm.allowAgentIdOverride: true`
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    เรียกใช้เมธอด Gateway อื่นภายในกระบวนการโดยคงอัตลักษณ์รันไทม์ที่เชื่อถือได้ของปลั๊กอินปัจจุบัน
    วิธีนี้มีไว้สำหรับปลั๊กอินทางการที่มาพร้อมระบบหรือเชื่อถือได้ ซึ่งประกอบความสามารถ Gateway
    ที่ปลั๊กอินเป็นผู้ดูแลโดยไม่ต้องเปิดการเชื่อมต่อ WebSocket แบบลูปแบ็ก

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    คำขอใช้ขอบเขต `operator.write` และไม่มอบขอบเขตผู้ดูแลระบบ การเรียกจากปลั๊กอินภายนอก
    ใดๆ จะถูกปฏิเสธ เมธอดที่ล้มเหลวจะโยน `GatewayClientRequestError` โดยคง
    `details` ที่มีโครงสร้าง ข้อมูลเมตาการลองใหม่ และรหัสข้อผิดพลาด Gateway ไว้สำหรับขั้นตอนการกู้คืน ใช้ `isAvailable()`
    ก่อนเลือกเส้นทางนี้จากเครื่องมือที่สามารถทำงานในกระบวนการเอเจนต์แบบสแตนด์อโลนได้ด้วย

  </Accordion>
  <Accordion title="api.runtime.subagent">
    เริ่มต้นและจัดการการทำงานของเอเจนต์ย่อยในเบื้องหลัง

    ```typescript
    // เริ่มการทำงานของเอเจนต์ย่อย
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "ขยายคำค้นนี้ให้เป็นการค้นหาติดตามผลที่มีเป้าหมายชัดเจน",
      toolsAlsoAllow: ["my_plugin_progress"],
      provider: "openai", // การแทนที่เพิ่มเติม
      model: "gpt-5.6-sol", // การแทนที่เพิ่มเติม
      deliver: false,
    });

    // รอให้เสร็จสมบูรณ์
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // อ่านข้อความของเซสชัน
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // ลบเซสชัน
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    การแทนที่โมเดล (`provider`/`model`) ต้องให้ผู้ดำเนินการเลือกเข้าร่วมผ่าน `plugins.entries.<id>.subagent.allowModelOverride: true` ในการกำหนดค่า ปลั๊กอินที่ไม่น่าเชื่อถือยังสามารถเรียกใช้เอเจนต์ย่อยได้ แต่คำขอแทนที่จะถูกปฏิเสธ
    </Warning>

    `toolsAlsoAllow` เพิ่มเครื่องมือที่ตรงกันทุกประการและมีปลั๊กอินผู้เรียกเป็นเจ้าของเพียงผู้เดียว ซึ่งลงทะเบียนไว้แล้ว เข้าไปในพื้นผิวเครื่องมือปกติของเวิร์กเกอร์ รันไทม์จะปฏิเสธเครื่องมือหลักและชื่อที่ใช้ร่วมกับปลั๊กอินอื่น โปรไฟล์และนโยบายเครื่องมือของผู้ดำเนินการยังคงมีผล รวมถึงรายการอนุญาตและการปฏิเสธที่ระบุชัดเจน

    `deleteSession(...)` สามารถลบเซสชันที่ปลั๊กอินเดียวกันสร้างผ่าน `api.runtime.subagent.run(...)` การลบเซสชันของผู้ใช้หรือผู้ดำเนินการใดๆ ยังคงต้องใช้คำขอ Gateway ที่มีขอบเขตผู้ดูแลระบบ

  </Accordion>
  <Accordion title="api.runtime.sandbox">
    ตรวจสอบสิทธิ์เหนือเวิร์กสเปซแซนด์บ็อกซ์ที่มีผลสำหรับเซสชันเอเจนต์

    ```typescript
    const authority = api.runtime.sandbox.resolveWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
    });

    const liveAuthority = await api.runtime.sandbox.prepareWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
      workspaceDir,
      confinedToolNames: ["my_plugin_safe_tool"],
    });
    ```

    ผลลัพธ์รายงานว่าเซสชันนี้อยู่ในแซนด์บ็อกซ์หรือไม่ เวิร์กสเปซ
    ใช้งานไม่ได้ อ่านอย่างเดียว หรือเขียนได้ และมี `confinementError` ซึ่งเป็นตัวเลือก
    เมื่อ Docker เครื่องมือ เซสชัน เบราว์เซอร์ หรือนโยบายสิทธิ์ยกระดับที่มีผลสามารถ
    หลุดออกจากเวิร์กสเปซนั้นได้ ใช้ข้อมูลนี้สำหรับการตัดสินใจมอบหมายงานที่โฮสต์เป็นผู้ดูแล ซึ่ง
    ต้องไม่มอบสิทธิ์ให้เวิร์กเกอร์มากกว่าผู้เรียก นี่คือตัวช่วยรับรอง
    ไม่ใช่สิ่งทดแทนการตรวจสอบการอนุญาตของผู้เรียกเอง

    `prepareWorkspaceAuthority(...)` ทำการตรวจสอบนโยบายเดียวกันและยัง
    เตรียมแซนด์บ็อกซ์ Docker สำหรับ `workspaceDir` ด้วย โดยจะปฏิเสธคอนเทนเนอร์ที่กำลังทำงาน
    ซึ่งแฮชการกำหนดค่าปัจจุบันไม่ตรงกับเมานต์หรือนโยบายที่ร้องขอ ส่งเฉพาะ
    ชื่อเครื่องมือที่ตรงกันทุกประการซึ่งปลั๊กอินผู้เรียกจำกัดการทำงานของอิมพลีเมนเทชัน
    ที่ลงทะเบียนไว้ คำนำหน้าไวลด์การ์ดไม่สามารถพิสูจน์ความเป็นเจ้าของเครื่องมือได้

  </Accordion>
  <Accordion title="api.runtime.nodes">
    แสดงรายการ Node ที่เชื่อมต่อและเรียกใช้คำสั่งของโฮสต์ Node จากโค้ดปลั๊กอินที่ Gateway โหลด หรือจากคำสั่ง CLI ของปลั๊กอิน ใช้เมื่อปลั๊กอินเป็นเจ้าของงานภายในเครื่องบนอุปกรณ์ที่จับคู่ไว้ เช่น บริดจ์เบราว์เซอร์หรือเสียงบน Mac เครื่องอื่น

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` ประกอบด้วยดีสคริปเตอร์
    `nodePluginTools` ที่ Node แต่ละรายการซึ่งเชื่อมต่ออยู่ประกาศ เมื่อ Node นั้นเปิดเผยเครื่องมือ
    ที่ปลั๊กอินหรือ MCP รองรับให้เอเจนต์ ดีสคริปเตอร์เหล่านั้นเป็นสถานะการเชื่อมต่อสด โดย Gateway
    จะนำออกเมื่อ Node ยกเลิกการเชื่อมต่อ และ Node สามารถแทนที่ด้วย
    `node.pluginTools.update` หลังรายการปลั๊กอิน/MCP ภายในเครื่องเปลี่ยนแปลง

    ภายใน Gateway รันไทม์นี้ทำงานในโพรเซสเดียวกัน ในคำสั่ง CLI ของ Plugin รันไทม์จะเรียก Gateway ที่กำหนดค่าไว้ผ่าน RPC ดังนั้นคำสั่งอย่าง `openclaw googlemeet recover-tab` จึงสามารถตรวจสอบ Node ที่จับคู่แล้วจากเทอร์มินัลได้ คำสั่ง Node ยังคงผ่านการจับคู่ Node ตามปกติของ Gateway, รายการคำสั่งที่อนุญาต, นโยบายเรียกใช้ Node ของ Plugin และการจัดการคำสั่งภายใน Node

    Plugin ที่เปิดเผยเครื่องมือเอเจนต์ซึ่งโฮสต์บน Node สามารถตั้งค่า `agentTool.defaultPlatforms` สำหรับคำสั่งที่ไม่เป็นอันตรายและควรอยู่ในรายการที่อนุญาตโดยค่าเริ่มต้น ไม่ต้องระบุค่านี้เมื่อผู้ดำเนินการต้องเลือกเปิดใช้ด้วย `gateway.nodes.allowCommands` คำสั่งโฮสต์ Node ที่เป็นอันตรายควรลงทะเบียนนโยบายเรียกใช้ Node ด้วย `api.registerNodeInvokePolicy(...)`; นโยบายจะทำงานใน Gateway หลังจากตรวจสอบรายการคำสั่งที่อนุญาตและก่อนส่งต่อคำสั่งไปยัง Node ดังนั้นการเรียก `node.invoke` โดยตรง เครื่องมือ Plugin ที่โฮสต์บน Node และเครื่องมือ Plugin ระดับสูงกว่าจะใช้เส้นทางบังคับใช้นโยบายเดียวกัน

    <Warning>
    ฟิลด์ `scopes` ซึ่งเป็นตัวเลือกจะร้องขอขอบเขตสิทธิ์ของผู้ดำเนินการ Gateway สำหรับการเรียกใช้ OpenClaw จะยอมรับค่านี้เฉพาะสำหรับ Plugin ที่รวมมาในชุดและการติดตั้ง Plugin อย่างเป็นทางการที่เชื่อถือได้เท่านั้น คำขอจาก Plugin อื่นจะไม่ยกระดับสิทธิ์ของการเรียก ใช้ค่านี้เฉพาะเมื่อ Plugin ที่เชื่อถือได้ต้องเรียกคำสั่ง Node ด้วยขอบเขตสิทธิ์ Gateway ที่เข้มงวดยิ่งขึ้น เช่น `operator.admin`
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    ผูกสถานะ Task Flow และ Task Run เข้ากับคีย์เซสชัน OpenClaw ที่มีอยู่หรือบริบทเครื่องมือที่เชื่อถือได้

    - `api.runtime.tasks.managedFlows` รองรับการเปลี่ยนแปลงข้อมูล: สร้าง ดำเนินต่อ และยกเลิก Task Flow
    - `api.runtime.tasks.flows` และ `api.runtime.tasks.runs` เป็นมุมมอง DTO แบบอ่านอย่างเดียวสำหรับการแสดงรายการและค้นหาสถานะ ทั้งสองเปิดเผย `bindSession(...)` / `fromToolContext(...)` รวมถึง `get`, `list`, `findLatest` และ `resolve`

    Task Flow ติดตามสถานะเวิร์กโฟลว์หลายขั้นตอนแบบคงทน ไม่ใช่ตัวจัดกำหนดการ:
    ใช้ Cron หรือ `api.session.workflow.scheduleSessionTurn(...)` สำหรับการปลุกให้ทำงาน
    ในอนาคต จากนั้นใช้ `managedFlows` จากรอบการทำงานตามกำหนดการเมื่องานนั้น
    ต้องใช้สถานะโฟลว์ งานย่อย การรอ หรือการยกเลิก

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "รีวิว pull request ใหม่",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "รีวิว PR #123",
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

    ใช้ `bindSession({ sessionKey, requesterOrigin })` เมื่อมีคีย์เซสชัน OpenClaw ที่เชื่อถือได้จากเลเยอร์การผูกของตนเองอยู่แล้ว อย่าผูกจากอินพุตดิบของผู้ใช้

  </Accordion>
  <Accordion title="api.runtime.tts">
    การสังเคราะห์ข้อความเป็นเสียงพูด

    ```typescript
    // TTS มาตรฐาน
    const clip = await api.runtime.tts.textToSpeech({
      text: "สวัสดีจาก OpenClaw",
      cfg: api.config,
    });

    // TTS ที่ปรับให้เหมาะกับระบบโทรศัพท์
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "สวัสดีจาก OpenClaw",
      cfg: api.config,
    });

    // แสดงรายการเสียงที่พร้อมใช้งาน
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    ใช้การกำหนดค่า `messages.tts` และการเลือกผู้ให้บริการจากแกนหลัก คืนค่าบัฟเฟอร์เสียง PCM พร้อมอัตราการสุ่มตัวอย่าง นอกจากนี้ยังมี `textToSpeechStream` สำหรับการสังเคราะห์แบบสตรีม

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    การวิเคราะห์รูปภาพ เสียง และวิดีโอ

    ```typescript
    // อธิบายรูปภาพ
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // ถอดเสียง
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // เป็นตัวเลือก สำหรับกรณีที่ไม่สามารถอนุมาน MIME ได้
    });

    // อธิบายวิดีโอ
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // การวิเคราะห์ไฟล์ทั่วไป
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // แยกข้อมูลที่มีโครงสร้างจากรูปภาพผ่านผู้ให้บริการ/โมเดลที่ระบุ
    // ต้องมีรูปภาพอย่างน้อยหนึ่งรูป อินพุตข้อความเป็นบริบทเสริม
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "ให้ใช้ยอดรวมที่พิมพ์ไว้ก่อนหมายเหตุที่เขียนด้วยลายมือ" },
      ],
      instructions: "แยกผู้ขาย ยอดรวม และแท็กที่ค้นหาได้",
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

    คืนค่า `{ text: undefined }` เมื่อไม่มีเอาต์พุตเกิดขึ้น (เช่น อินพุตถูกข้าม)

    `describeImageFileWithModel(...)` อธิบายรูปภาพที่ทราบอยู่แล้วผ่านผู้ให้บริการ/โมเดลที่ระบุ โดยข้ามการหาโมเดลที่ใช้งานอยู่ตามค่าเริ่มต้นซึ่ง `describeImageFile(...)` ใช้

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    การสร้างรูปภาพ

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "หุ่นยนต์กำลังวาดภาพพระอาทิตย์ตก",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    การสร้างวิดีโอ โดยมีรูปแบบเดียวกับการสร้างรูปภาพ

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "ภาพจากโดรนที่บินเหนือแนวชายฝั่งยามพระอาทิตย์ขึ้น",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    การสร้างเพลง โดยมีรูปแบบเดียวกับการสร้างรูปภาพ

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "เพลงโลไฟจังหวะสนุกสำหรับช่วงเขียนโค้ด",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    การค้นหาเว็บ

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "SDK Plugin ของ OpenClaw", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    ยูทิลิตีสื่อระดับล่าง

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "รูปภาพ"
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
    การกำหนดค่าที่ส่งเข้ามาในเส้นทางการเรียกใช้งานที่ใช้งานอยู่แล้ว ใช้
    `current()` เฉพาะเมื่อแฮนด์เลอร์ต้องใช้สแนปช็อตของโพรเซสโดยตรง

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
    ตัวอย่างเช่น `{ mode: "restart", requiresRestart: true, reason }`
    ซึ่งบันทึกเจตนาของผู้เขียนโดยไม่ดึงการควบคุมการรีสตาร์ตออกจาก
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
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // นามแฝงเพื่อความเข้ากันได้ที่เลิกใช้แล้ว
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` เรียกใช้รอบ Heartbeat หนึ่งรอบทันที โดยข้ามตัวจับเวลารวมเหตุการณ์ตามปกติ ส่ง `{ heartbeat: { target: "last" } }` เพื่อบังคับการส่งไปยังช่องทางที่ใช้งานล่าสุดแทนการระงับ `target: "none"` ตามค่าเริ่มต้น

    `runCommandWithTimeout(...)` คืนค่า `stdout` และ `stderr` ที่บันทึกไว้ พร้อมจำนวน
    การตัดทอนที่เป็นตัวเลือก, `code`, `signal`, `killed`, `termination` และ
    `noOutputTimedOut` ผลลัพธ์การหมดเวลาและการหมดเวลาเนื่องจากไม่มีเอาต์พุตจะรายงาน `code: 124`
    เมื่อโพรเซสลูกไม่ได้ให้รหัสออกที่ไม่เป็นศูนย์ การออกด้วยสัญญาณ
    ที่ไม่ใช่การหมดเวลายังคงสามารถคืนค่า `code: null` ได้ ดังนั้นให้ใช้ `termination` และ
    `noOutputTimedOut` เพื่อแยกแยะสาเหตุของการหมดเวลา

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
    การแก้ไขการยืนยันตัวตนของโมเดลและผู้ให้บริการ

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // การยืนยันตัวตนที่พร้อมใช้กับคำขอ รวมถึงการแลกเปลี่ยนในรันไทม์ของผู้ให้บริการ (เช่น การรีเฟรช OAuth)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    การหาตำแหน่งไดเรกทอรีสถานะและพื้นที่จัดเก็บแบบคีย์ที่รองรับด้วย SQLite

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
    await store.deleteIf?.("key-1", (current) => current.value === "hello");
    await store.consume("key-1");
    await store.clear();

    const blobs = api.runtime.state.openBlobStore<MyBlobMetadata>({
      namespace: "rendered-artifacts",
      maxEntries: 100,
      maxBytesPerEntry: 4 * 1024 * 1024,
      maxBytesPerNamespace: 64 * 1024 * 1024,
      defaultTtlMs: 15 * 60_000,
    });
    await blobs.register(
      "artifact-1",
      new TextEncoder().encode("binary or text payload"),
      { contentType: "text/plain" },
    );
    const blob = await blobs.lookup("artifact-1");

    await api.runtime.state.withLease(
      {
        namespace: "my-feature",
        key: "writer",
        database: { scope: "agent", agentId },
        leaseMs: 5 * 60_000,
        waitMs: 30_000,
      },
      async ({ signal, assertOwned }) => {
        await runExternalWriter({ signal });
        assertOwned();
      },
    );
    ```

    ที่เก็บแบบมีคีย์จะคงอยู่แม้เริ่มระบบใหม่และแยกจากกันตามรหัส Plugin ที่ผูกกับรันไทม์ ใช้ `registerIfAbsent(...)` สำหรับการอ้างสิทธิ์เพื่อขจัดรายการซ้ำแบบอะตอมมิก โดยจะส่งคืน `true` เมื่อไม่มีคีย์ คีย์หมดอายุ และลงทะเบียนสำเร็จ หรือส่งคืน `false` เมื่อมีค่าที่ยังใช้งานอยู่แล้ว โดยไม่เขียนทับค่า เวลาที่สร้าง หรือ TTL ใช้ `deleteIf(...)` เมื่อการล้างข้อมูลต้องลบเฉพาะค่าที่พบก่อนหน้านี้ โดยเพรดิเคตแบบซิงโครนัสและการลบจะทำงานภายในธุรกรรม SQLite เดียวกัน ขีดจำกัด: `maxEntries` ต่อเนมสเปซ, 50,000 แถวที่ยังใช้งานอยู่ต่อ Plugin, ค่า JSON ขนาดไม่เกิน 64KB และการหมดอายุด้วย TTL ที่เลือกใช้ได้ ตามค่าเริ่มต้น การเขียนเมื่อถึงขีดจำกัดแถวอย่างใดอย่างหนึ่งจะนำแถวที่ยังใช้งานอยู่ซึ่งเก่าที่สุดออกจากเนมสเปซที่กำลังเขียน เนมสเปซข้างเคียงจะไม่ถูกขับออกสำหรับการเขียนนั้น และการเขียนจะยังคงล้มเหลวหากเนมสเปซไม่สามารถเพิ่มพื้นที่ว่างได้เพียงพอ ตั้งค่า `overflowPolicy: "reject-new"` สำหรับเรคคอร์ดความเป็นเจ้าของแบบคงทนที่ห้ามถูกขับออก โดยคีย์ใหม่จะล้มเหลวเมื่อถึงขีดจำกัดอย่างใดอย่างหนึ่ง ส่วนคีย์เดิมยังคงอัปเดตได้

    `openSyncKeyedStore<T>(...)` ส่งคืนที่เก็บที่มีรูปแบบเดียวกันพร้อมเมธอดแบบซิงโครนัส (`register`, `registerIfAbsent`, `deleteIf`, `lookup`, `consume`, `clear` ทั้งหมดส่งคืนค่าโดยตรงแทนพรอมิส) สำหรับผู้เรียกที่ไม่สามารถรอด้วย await ได้

    `openBlobStore<TMetadata>(...)` จัดเก็บเพย์โหลดไบนารีที่จำกัดขนาดไว้ใน SQLite ที่ใช้ร่วมกันโดยไม่ใช้ base64 หรือไฟล์ประกอบ โดยกำหนดให้มีขีดจำกัดไบต์ต่อรายการ ไบต์ต่อเนมสเปซ และจำนวนแถว คัดลอกอาร์เรย์ไบต์ที่ขอบเขต API และแสดงรายการเมทาดาทาโดยไม่โหลด BLOB ทุกรายการ `register(...)` เป็นการ upsert อย่างชัดเจน รวมถึงคีย์ที่หมดอายุแล้ว `registerIfAbsent(...)` รองรับการสร้างที่ปลอดภัยจากการชนกัน โดยคีย์ที่หมดอายุแล้วยังคงถูกครอบครองจนกว่าเจ้าของจะอ้างสิทธิ์ด้วย `deleteExpiredKey(key)` หรือ `deleteExpired()` ซึ่งจะรักษาเมทาดาทาที่จำเป็นต่อการลบอาร์ติแฟกต์ที่มีชื่อและเกี่ยวข้องกันหลังจากคอมมิต SQLite แถวใดก็ตามที่มี TTL ถือเป็นข้อมูลชั่วคราวและจะไม่รวมในการสำรอง/กู้คืน แม้ยังไม่หมดอายุ หากต้องการสถานะแบบคงทนที่กู้คืนได้ ให้ละเว้น TTL ฟิวส์ของโฮสต์จำกัด BLOB แต่ละรายการไว้ที่ 100 MiB, BLOB ที่จัดเก็บจริงของแต่ละ Plugin ไว้ที่ 512 MiB และแถวที่จัดเก็บจริงของแต่ละ Plugin ไว้ที่ 50,000 แถว รวมถึงแถวที่หมดอายุแล้วและกำลังรอให้เจ้าของล้างข้อมูล ใช้ `registerIfAbsent(...)` ร่วมกับ `overflowPolicy: "reject-new"` เมื่อการสร้างวัตถุภายนอกต้องไม่ถูกปล่อยให้ไร้เจ้าของโดยไม่มีการแจ้งเตือนจากการแทนที่หรือการขับออก

    `openChannelIngressQueue<TPayload>(...)` เปิดคิวขาเข้าแบบคงอยู่ซึ่งกำหนดขอบเขตตาม Plugin ที่เรียกใช้ สำหรับบัฟเฟอร์เหตุการณ์ขาเข้าที่ต้องประมวลผลแบบอย่างน้อยหนึ่งครั้งข้ามการเริ่มระบบใหม่ เมื่อการกู้คืนการอ้างสิทธิ์ที่ค้างใช้ `shouldRecover` ให้ระบุ `shouldRecoverCorrupt` ด้วย หากควรกักกันเพย์โหลดที่อ้างสิทธิ์แล้วแต่เสียหาย โดยข้อมูลประจำตัวการอ้างสิทธิ์ที่ไม่ขึ้นกับเพย์โหลดช่วยให้ Plugin รักษานโยบายเจ้าของและเลนที่ยังใช้งานอยู่ ก่อนที่คิวจะทำเครื่องหมายแถวเป็น tombstone

    `withLease(...)` จัดลำดับงานของ Plugin ที่ทำงานร่วมกันระหว่างโปรเซส OpenClaw เลือก `database: { scope: "shared" }` สำหรับเจ้าของส่วนกลางหนึ่งราย หรือ `{ scope: "agent", agentId }` สำหรับความเป็นเจ้าของที่แยกกันต่อเอเจนต์ ส่งต่อ `AbortSignal` ของคอลแบ็กไปยังทุกการดำเนินการที่อาจล้มเหลว `assertOwned()` เป็นจุดตรวจสอบ ณ ขณะหนึ่งก่อนเริ่มขั้นตอนสำคัญถัดไป และโฮสต์จะตรวจสอบความเป็นเจ้าของหลังจากคอลแบ็กด้วย การสูญเสียลีสหรือการยกเลิกโดยผู้เรียกจะยกเลิกสัญญาณ การรอเพื่อได้สิทธิ์และ Heartbeat จะเกิดขึ้นนอกธุรกรรม SQLite แบบซิงโครนัสช่วงสั้น ๆ Plugin จะไม่ได้รับพาธหรือแฮนเดิลฐานข้อมูล กลไกนี้เป็นการยกเลิกร่วมกัน ไม่ใช่ fencing token หรือการอนุญาตให้เขียนภายนอกโดยไม่มีการป้องกันด้วย fence

    `openChannelIngressDrain(...)` เปิดเวิร์กเกอร์หลักที่ไม่ขึ้นกับช่องทางเหนือคิวนั้น (หรือสร้างคิวเมื่อไม่ได้ระบุ) การระบายคิวรับผิดชอบการกู้คืนการอ้างสิทธิ์ที่ค้าง การจัดลำดับการอ้างสิทธิ์ต่อเลน การทำให้เสร็จเมื่อรับช่วงหรือเมื่อการส่งคืนค่า การกำหนดผลลัพธ์ให้ลองใหม่/ส่งไปยัง dead letter การแทนที่ก่อนรับช่วงที่เลือกใช้ได้ และการหมดเวลาของการค้างระหว่างการอ้างสิทธิ์→การรับช่วง เชื่อมความเป็นเจ้าของการอ้างสิทธิ์เข้ากับการสร้างการตอบกลับด้วย `turnAdoptionLifecycle` (ผ่าน `bindIngressLifecycleToReplyOptions` จาก `plugin-sdk/channel-outbound`) Plugin ช่องทางจะยังคงรับผิดชอบการเพิ่มเข้าคิวฝั่งรับ การหาเลน การจัดประเภทที่ไม่ควรลองใหม่ และนโยบายอนุญาตการแทนที่ใด ๆ

    <Warning>
    `openBlobStore`, `openKeyedStore`, `openSyncKeyedStore`, `withLease`, `openChannelIngressQueue` และ `openChannelIngressDrain` พร้อมใช้งานเฉพาะสำหรับ Plugin ที่รวมมาในชุดและการติดตั้ง Plugin อย่างเป็นทางการที่เชื่อถือได้ในรุ่นนี้
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    ตัวช่วยรันไทม์เฉพาะช่องทาง (พร้อมใช้งานเมื่อโหลด Plugin ช่องทาง) จัดกลุ่มตามวัตถุประสงค์:

    | กลุ่ม | วัตถุประสงค์ |
    | --- | --- |
    | `text` | การแบ่งเป็นส่วน (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), การตรวจจับคำสั่งควบคุม, การแปลงตาราง Markdown |
    | `reply` | การส่งการตอบกลับแบบบล็อกที่บัฟเฟอร์ไว้, การจัดรูปแบบเอนเวโลป, การหาค่าคอนฟิกข้อความที่มีผล/การหน่วงแบบมนุษย์ |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute` |
    | `pairing` | `buildPairingReply`, การอ่าน/ลบรายการอนุญาต, การ upsert คำขอจับคู่ และรายการอนุมัติที่ได้จากคำขอ |
    | `media` | การดาวน์โหลด/บันทึกสื่อระยะไกล (ดูด้านล่าง) |
    | `activity` | บันทึก/อ่านกิจกรรมล่าสุดของช่องทาง |
    | `session` | เมทาดาทาเซสชันจากเหตุการณ์ขาเข้า, การอัปเดตเส้นทางล่าสุด |
    | `mentions` | ตัวช่วยนโยบายการกล่าวถึง (ดูด้านล่าง) |
    | `reactions` | แฮนเดิลปฏิกิริยาตอบรับสำหรับตัวบ่งชี้การประมวลผลที่กำลังดำเนินอยู่ |
    | `groups` | การหาค่านโยบายกลุ่มและข้อกำหนดให้กล่าวถึง |
    | `debounce` | การลดการสั่นของข้อความขาเข้า |
    | `commands` | การอนุญาตคำสั่งและการควบคุมคำสั่งแบบข้อความ |
    | `outbound` | โหลดอะแดปเตอร์ขาออกของช่องทาง |
    | `inbound` | สร้างบริบทเหตุการณ์ขาเข้าและเรียกใช้เคอร์เนลเหตุการณ์ขาเข้า/การตอบกลับที่ใช้ร่วมกัน |
    | `threadBindings` | ปรับการหมดเวลาเมื่อไม่มีการใช้งาน/อายุสูงสุดสำหรับเธรดเซสชันที่ผูกไว้ |
    | `runtimeContexts` | ลงทะเบียน อ่าน และเฝ้าดูบริบทภายในโปรเซสต่อช่องทาง/บัญชี/ความสามารถ |

    `api.runtime.channel.media` เป็นพื้นผิวที่แนะนำสำหรับการดาวน์โหลดและจัดเก็บสื่อของช่องทาง:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    ใช้ `saveRemoteMedia(...)` เมื่อต้องการเปลี่ยน URL ระยะไกลเป็นสื่อของ OpenClaw ใช้ `saveResponseMedia(...)` เมื่อ Plugin ดึงข้อมูล `Response` เรียบร้อยแล้วด้วยการตรวจสอบสิทธิ์ การเปลี่ยนเส้นทาง หรือการจัดการรายการอนุญาตที่ Plugin เป็นเจ้าของ ใช้ `readRemoteMediaBuffer(...)` เฉพาะเมื่อ Plugin ต้องการไบต์ดิบสำหรับการตรวจสอบ การแปลง การถอดรหัส หรือการอัปโหลดซ้ำ `fetchRemoteMedia(...)` ยังคงเป็นนามแฝงเพื่อความเข้ากันได้ที่เลิกแนะนำแล้วสำหรับ `readRemoteMediaBuffer(...)`

    `api.runtime.channel.mentions` เป็นพื้นผิวนโยบายการกล่าวถึงขาเข้าที่ใช้ร่วมกันสำหรับ Plugin ช่องทางที่รวมมาในชุดและใช้การฉีดรันไทม์:

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

    ใช้พาธ `{ facts, policy }` ที่ปรับให้อยู่ในรูปแบบมาตรฐานแล้วสำหรับการตัดสินใจเกี่ยวกับการกล่าวถึง

    หลายฟิลด์ภายใต้ `reply`, `session` และ `inbound` มีหมายเหตุ `@deprecated` แยกตามฟิลด์ ซึ่งชี้ไปยังเคอร์เนลรอบการทำงานของช่องทางหรืออะแดปเตอร์ขาออกของช่องทางในปัจจุบัน โปรดตรวจสอบ JSDoc ในบรรทัดของตัวช่วยที่ต้องการก่อนสร้างโค้ดใหม่โดยอิงจากตัวช่วยนั้น

  </Accordion>
</AccordionGroup>

## การจัดเก็บการอ้างอิงรันไทม์

ใช้ `createPluginRuntimeStore` เพื่อจัดเก็บการอ้างอิงรันไทม์สำหรับใช้งานภายนอกคอลแบ็ก `register`:

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
  <Step title="เชื่อมเข้ากับจุดเริ่มต้น">
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
ควรใช้ `pluginId` สำหรับข้อมูลประจำตัวของที่เก็บรันไทม์ รูปแบบระดับล่าง `key` ใช้สำหรับกรณีที่พบไม่บ่อย ซึ่ง Plugin เดียวจำเป็นต้องมีสล็อตรันไทม์มากกว่าหนึ่งสล็อตโดยเจตนา
</Note>

## ฟิลด์ระดับบนสุดอื่น ๆ ของ `api`

นอกเหนือจาก `api.runtime` ออบเจ็กต์ API ยังมีรายการต่อไปนี้:

<ParamField path="api.id" type="string">
  รหัส Plugin
</ParamField>
<ParamField path="api.name" type="string">
  ชื่อที่แสดงของ Plugin
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  สแนปช็อตคอนฟิกปัจจุบัน (สแนปช็อตรันไทม์ในหน่วยความจำที่ใช้งานอยู่เมื่อพร้อมใช้งาน)
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  คอนฟิกเฉพาะ Plugin จาก `plugins.entries.<id>.config`
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  ตัวบันทึกที่กำหนดขอบเขตแล้ว (`debug`, `info`, `warn`, `error`)
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  โหมดการโหลดปัจจุบัน: `"full"` (การเปิดใช้งานจริง), `"discovery"` / `"tool-discovery"` (การค้นหาความสามารถแบบอ่านอย่างเดียว), `"setup-only"` (จุดเริ่มต้นการตั้งค่าแบบน้ำหนักเบา), `"setup-runtime"` (ขั้นตอนการตั้งค่าที่ต้องใช้จุดเริ่มต้นช่องทางรันไทม์ด้วย) หรือ `"cli-metadata"` (การรวบรวมเมทาดาทาคำสั่ง CLI)
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  แปลงพาธสัมพัทธ์กับรูทของ Plugin
</ParamField>

## ที่เกี่ยวข้อง

- [การทำงานภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและรีจิสทรี
- [จุดเข้าใช้งาน SDK](/th/plugins/sdk-entrypoints) — ตัวเลือก `definePluginEntry`
- [ภาพรวม SDK](/th/plugins/sdk-overview) — เอกสารอ้างอิงพาธย่อย
