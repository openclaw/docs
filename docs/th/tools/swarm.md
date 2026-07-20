---
read_when:
    - คุณต้องการให้สคริปต์ Code Mode กระจายงานไปยังเอเจนต์หลายตัว
    - คุณต้องการผลลัพธ์จากงานย่อยที่มีโครงสร้าง จุดตรวจสอบการตัดสินใจ หรือไปป์ไลน์ที่ทำงานจนกว่างานแรกจะเสร็จสมบูรณ์
    - คุณกำลังเปิดใช้งานหรือปรับแต่งขีดจำกัดของ `tools.swarm`
    - คุณต้องการดูโหนดย่อยของตัวรวบรวมในแดชบอร์ดเซสชัน
sidebarTitle: Swarm
summary: ประสานงานซับเอเจนต์ที่ทำงานพร้อมกันจากสคริปต์ Code Mode พร้อมผลลัพธ์แบบมีโครงสร้าง การกระจายงานแบบจำกัด และความคืบหน้าแบบเรียลไทม์
title: ฝูงเอเจนต์
x-i18n:
    generated_at: "2026-07-20T16:04:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00881c10c314eca667dd826584bfc83a4d848d8995e68905e4e53782d61c59cd
    source_path: tools/swarm.md
    workflow: 16
---

Swarm เป็นวิธีทดลองแบบเลือกใช้สำหรับควบคุมประสานงาน sub-agent จำนวนมากจากสคริปต์
[โหมดโค้ด](/th/tools/code-mode) ใช้โฟลว์ควบคุม JavaScript หรือ TypeScript ตามปกติ
เช่น `Promise.all`, `while` และ `if` เพื่อกระจายงาน รวบรวม
ผลลัพธ์ และตัดสินใจ

ไม่มี DSL แบบกราฟและไม่มีรูปแบบเวิร์กโฟลว์แยกต่างหาก ตัวโปรแกรมคือ
การควบคุมประสานงาน Swarm เพิ่ม child แบบตัวรวบรวมที่รอผลได้ ผลลัพธ์แบบมีโครงสร้าง
ภาวะพร้อมกันที่มีขอบเขต และการรายงานความคืบหน้าให้แก่โปรแกรมนั้น

## เปิดใช้ Swarm

แนวทางที่แนะนำคือ **Settings → Labs → Swarm** ใน Control UI
สวิตช์มีผลทันทีและเขียน `tools.swarm.enabled` ลงในการกำหนดค่า

นอกจากนี้ยังเปิดใช้ Swarm ได้โดยตรงใน `openclaw.json`:

```json5
{
  tools: {
    swarm: {
      enabled: true,
      maxConcurrent: 8,
      maxChildrenPerGroup: 50,
      maxTotalPerGroup: 200,
      waitTimeoutSecondsMax: 600,
      defaultAgentId: "",
    },
  },
}
```

รูปแบบย่อแบบบูลีนจะเปิดหรือปิดฟีเจอร์โดยให้ค่าอื่นทั้งหมดใช้
ค่าเริ่มต้น:

```json5
{
  tools: {
    swarm: true,
  },
}
```

| ฟิลด์                   | ค่าเริ่มต้น | คำอธิบาย                                                                                                                    |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`               | `false` | เปิดให้ใช้ตัวเลือกการสร้างแบบตัวรวบรวม, `agents_wait` และ guest API `agents.*` ของโหมดโค้ด                                   |
| `maxConcurrent`         | `8`     | จำนวนสูงสุดของ child แบบตัวรวบรวมที่ทำงานพร้อมกันในกลุ่ม swarm หนึ่งกลุ่ม child เพิ่มเติมที่ได้รับการยอมรับจะเข้าคิวตามลำดับ FIFO          |
| `maxChildrenPerGroup`   | `50`    | จำนวนสูงสุดของ child แบบตัวรวบรวมที่ยังใช้งานอยู่ในหนึ่งกลุ่ม                                                                                  |
| `maxTotalPerGroup`      | `200`   | จำนวนสูงสุดของ child แบบตัวรวบรวมที่กลุ่มหนึ่งสร้างได้ตลอดอายุการทำงาน ค่านี้เป็นมาตรการป้องกันการสร้างแบบควบคุมไม่ได้                            |
| `waitTimeoutSecondsMax` | `600`   | ระยะหมดเวลาสูงสุดที่การเรียก `agents_wait` หนึ่งครั้งยอมรับ ค่าเริ่มต้นของการเรียกคือ 30 วินาที                                            |
| `defaultAgentId`        | `""`    | Agent เป้าหมายที่ใช้เมื่อการสร้างละเว้น `agentId` ค่าว่างจะใช้ Agent ที่ส่งคำขอ รายการอนุญาต sub-agent ที่มีอยู่ยังคงมีผล |

ค่าตัวเลขต้องเป็นจำนวนเต็มบวก OpenClaw จำกัด
`maxConcurrent` ไว้ที่ `1`–`1000`, `maxChildrenPerGroup` ไว้ที่ `1`–`10000`,
`maxTotalPerGroup` ไว้ที่ `1`–`100000` และ `waitTimeoutSecondsMax` ไว้ที่
`1`–`86400`

สามารถแทนที่การตั้งค่า Swarm สำหรับ Agent ที่กำหนดค่าไว้หนึ่งรายการได้ด้วย
`agents.list[].tools.swarm` ออบเจ็กต์ราย Agent จะผสานทับออบเจ็กต์ระดับบนสุด
`tools.swarm`

## ข้อกำหนด

guest global `agents.run`, `phase` และ `log` ต้องใช้ทั้ง Swarm และ
โหมดโค้ดของ OpenClaw:

```json5
{
  tools: {
    codeMode: true,
    swarm: true,
  },
}
```

โหมดโค้ดต้องมีสิทธิ์เข้าถึง `sessions_spawn` ที่มีผลด้วย โปรไฟล์เครื่องมือ
นโยบายอนุญาต/ปฏิเสธ กฎของผู้ให้บริการ และนโยบาย sandbox อาจนำเครื่องมือนั้นออกได้
ดู[การเปิดใช้งานโหมดโค้ด](/th/tools/code-mode#activation) และ
[Sub-agent](/th/tools/subagents) หากสคริปต์รายงานว่า `sessions_spawn`
ไม่พร้อมใช้งาน

ค่า `defaultAgentId` และค่า `agentId` ต่อการเรียกใช้ต้องระบุเป้าหมายที่กำหนดค่าไว้
ซึ่งนโยบาย `subagents.allowAgents` ของผู้ส่งคำขออนุญาต OpenClaw จะปฏิเสธ
เป้าหมายที่ไม่รู้จักหรือไม่ได้รับอนุญาต แทนที่จะถอยไปใช้ Agent อื่น

## เขียนสคริปต์ Swarm

เมื่อเปิดใช้ Swarm โหมดโค้ดจะเปิดให้ใช้ guest API นี้:

```typescript
type AgentRunOptions = {
  label?: string;
  model?: string;
  thinking?: string;
  fastMode?: boolean | "auto";
  agentId?: string;
  schema?: Record<string, unknown>;
  phase?: string;
};

agents.run(prompt: string, options?: AgentRunOptions & { schema?: undefined }): Promise<string>;
agents.run<T>(prompt: string, options: AgentRunOptions & { schema: Record<string, unknown> }): Promise<T>;
phase(title: string): void;
log(message: string): void;
```

หากไม่มี `schema` ค่า `agents.run()` จะ resolve เป็นข้อความสุดท้ายของ child หากมี
JSON Schema ค่าจะ resolve เป็นค่าที่ส่งผ่านเครื่องมือ
`structured_output` ของ child child ที่ล้มเหลว ถูกยุติ หมดเวลา หรือไม่ตรงตาม schema
จะ reject promise ด้วย `SwarmAgentError` อ่าน declaration ที่สร้างขึ้นจริง
และรูปแบบการควบคุมประสานงานสั้น ๆ ได้จาก `API.read("agents.d.ts")`
ภายในโหมดโค้ด

ใช้ `label` เพื่อตั้งชื่อ child ที่จดจำได้ในแดชบอร์ดและแถบด้านข้าง ใช้
`phase` ในตัวเลือกเพื่อเผยแพร่เฟสทันทีก่อนที่ child นั้น
จะเริ่มทำงาน หรือเรียก `phase()` เมื่อ child หลายรายการอยู่ในขั้นตอนเดียวกัน
`log()` จะเผยแพร่บันทึกความคืบหน้าสั้น ๆ การเรียกความคืบหน้าเป็นแบบส่งแล้วไม่รอผล
จึงไม่ทำให้สคริปต์ล่าช้าหาก UI ไม่พร้อมใช้งาน

### กระจายงานแบบขนานพร้อมผลลัพธ์แบบมีโครงสร้าง

ตัวอย่างนี้เปิดตัวนักวิจัยหนึ่งรายต่อหนึ่งหัวข้อ รอให้ทั้งหมดทำงานเสร็จ แล้ว
ขอให้ child สุดท้ายสังเคราะห์รายงานแบบมีโครงสร้าง:

```javascript
const reportSchema = {
  type: "object",
  properties: {
    finding: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: ["finding", "evidence", "confidence"],
  additionalProperties: false,
};

const topics = ["authentication", "storage", "recovery"];
phase("การตรวจสอบโดยอิสระ");

const reports = await Promise.all(
  topics.map((topic) =>
    agents.run(`ตรวจสอบเส้นทาง ${topic} ส่งคืนข้อค้นพบหนึ่งรายการพร้อมหลักฐาน`, {
      label: `review-${topic}`,
      thinking: "high",
      fastMode: "auto",
      schema: reportSchema,
    }),
  ),
);

phase("การสังเคราะห์");
log(`รวบรวมรายงานอิสระแล้ว ${reports.length} รายการ`);

return await agents.run(
  `ตรวจสอบความสอดคล้องของรายงานเหล่านี้และอธิบายข้อขัดแย้ง:\n${JSON.stringify(reports)}`,
  { label: "synthesis" },
);
```

`Promise.all` คือขอบเขตการกระจายงานและรวมผล OpenClaw เริ่ม child ได้สูงสุด
`maxConcurrent` รายการสำหรับกลุ่ม และจัดรายการที่เหลือเข้าคิวตามลำดับ
การส่ง

### วนซ้ำตามเกณฑ์การตัดสินใจ

ใช้ลูป `while` ที่มีขอบเขตเมื่อแต่ละรอบตัดสินใจว่าจำเป็นต้องมีอีกรอบ
หรือไม่:

```javascript
const gateSchema = {
  type: "object",
  properties: {
    ready: { type: "boolean" },
    reason: { type: "string" },
    nextAction: { type: "string" },
  },
  required: ["ready", "reason", "nextAction"],
  additionalProperties: false,
};

let pass = 0;
let decision = { ready: false, reason: "ยังไม่ได้ตรวจสอบ", nextAction: "ตรวจสอบ" };

while (!decision.ready && pass < 4) {
  pass += 1;
  phase(`รอบการตัดสินใจ ${pass}`);
  decision = await agents.run(
    `ตรวจสอบว่าหลักฐานการเผยแพร่ครบถ้วนหรือไม่ การตัดสินใจก่อนหน้า: ${JSON.stringify(decision)}`,
    {
      label: `release-gate-${pass}`,
      schema: gateSchema,
    },
  );
  log(decision.reason);
}

if (!decision.ready) {
  throw new Error(`เกณฑ์ยังไม่ผ่านหลังจาก ${pass} รอบ: ${decision.nextAction}`);
}

return decision;
```

กำหนดขอบเขตลูปการตัดสินใจเสมอ `maxTotalPerGroup` เป็นมาตรการป้องกันขั้นสุดท้าย
ไม่ใช่สิ่งทดแทนเงื่อนไขการหยุดที่ชัดเจน

### ประมวลผล child รายการแรกที่เสร็จสิ้น

`agents.run()` ส่งคืน promise ปกติ ดังนั้น `Promise.race` จึงตอบสนองต่อ
child ของโหมดโค้ดรายการแรกได้ สำหรับ harness ที่เรียกเครื่องมือระดับล่าง
`agents_wait` ให้ขอบเขตการเสร็จสิ้นครั้งแรกแบบเดียวกัน โดยจะส่งคืนทันที
เมื่อการเรียกใช้ที่ร้องขออย่างน้อยหนึ่งรายการเสร็จสิ้น หรือเมื่อหมดเวลาที่มีขอบเขต
ดู[ใช้ Swarm จาก harness อื่น](#use-swarm-from-other-harnesses) สำหรับ
ลูปการระบายผลลัพธ์ฉบับสมบูรณ์

## พฤติกรรมของ child แบบตัวรวบรวม

child แบบตัวรวบรวมคือเซสชัน sub-agent แยกอิสระตามปกติที่มี
เส้นทางการทำงานเสร็จสิ้นต่างออกไป โดยจะเขียนผลลัพธ์ตัวรวบรวมแบบคงทนเพื่อให้ parent
รอรับ แทนที่จะประกาศหรือชี้นำคำตอบกลับเข้าสู่เซสชัน parent

Agent เป้าหมายจะถูกกำหนดตามลำดับนี้:

1. `agentId` ในการเรียกสร้างหรือการเรียก `agents.run()`
2. `tools.swarm.defaultAgentId`
3. Agent ที่ส่งคำขอ

Agent ผู้ปฏิบัติงานโดยเฉพาะที่มีขนาดเล็กและกระชับมีประโยชน์เมื่อ child ของ swarm ต้องใช้
ชุดเครื่องมือที่เล็กลง โมเดลที่มีต้นทุนต่ำลง หรือนโยบาย sandbox ที่เข้มงวดขึ้น OpenClaw ไม่ได้จัดส่ง
ID Agent `worker` ในตัว โปรดกำหนดค่าก่อนระบุเป็นค่าเริ่มต้น
เพิ่มความปลอดภัยให้ผู้ปฏิบัติงานนั้นด้วย `tools.swarm: false` ในการกำหนดค่าราย Agent เพื่อให้
สร้าง Agent นี้ได้ แต่ไม่สามารถเริ่ม swarm จากเซสชันระดับบนสุดของตนเองได้:

```json5
{
  tools: { swarm: { enabled: true, defaultAgentId: "worker" } },
  agents: {
    list: [
      {
        id: "main",
        default: true,
        subagents: { allowAgents: ["worker"] },
      },
      { id: "worker", tools: { swarm: false } },
    ],
  },
}
```

การอนุมัติของตัวรวบรวมจะปฏิเสธโดยค่าเริ่มต้น child จะไม่เปิดพรอมต์ขออนุมัติจาก
ผู้ปฏิบัติงาน การดำเนินการของเครื่องมือที่ต้องได้รับอนุมัติจะถูกปฏิเสธ และ child สามารถ
รายงานการปฏิเสธนั้นในผลลัพธ์เพื่อให้สคริปต์ตัดสินใจว่าจะทำอะไรต่อไป

สำหรับเอาต์พุตแบบมีโครงสร้าง OpenClaw จะเพิ่มเครื่องมือสังเคราะห์ `structured_output`
ให้แก่ child และตรวจสอบเพย์โหลดกับ JSON Schema ที่ให้มา เพย์โหลดที่
ไม่ถูกต้องหรือขาดหายจะได้รับคำแนะนำแก้ไขหนึ่งครั้ง หากการลองใหม่ยัง
ไม่ผ่านการตรวจสอบ การทำงานของตัวรวบรวมที่เสร็จสิ้นจะเก็บข้อความดิบของ child ไว้
ปล่อย `structured` ให้ไม่ได้ตั้งค่า และรวม `schemaError` ผลลัพธ์ `agents_wait`
ระดับล่างจะเปิดเผยฟิลด์เหล่านั้นสำหรับตรรกะการกู้คืนที่ระบุไว้อย่างชัดเจน

### child เป็นโหนดปลายทาง

child ของ Swarm เป็นโหนดปลายทางโดยค่าเริ่มต้น กลไกป้องกันสากล
`agents.defaults.subagents.maxSpawnDepth` ป้องกันไม่ให้ child สร้าง
child ของตนเองที่ความลึกเริ่มต้น `1` รูปแบบการควบคุมประสานงานโดยทั่วไปคือ
ส่งงานกลับไปยัง parent ไม่ใช่สร้างงานเพิ่มจาก child:

```javascript
const plan = await agents.run("วางแผนงานนี้เป็นงานย่อยอิสระ", {
  schema: {
    type: "object",
    properties: { tasks: { type: "array", items: { type: "string" } } },
    required: ["tasks"],
    additionalProperties: false,
  },
});
return await Promise.all(plan.tasks.map((task) => agents.run(task)));
```

sub-agent แบบซ้อนเป็นตัวเลือกที่ผู้ปฏิบัติงานต้องเปิดใช้ผ่าน
`agents.defaults.subagents.maxSpawnDepth` และไม่แนะนำให้ใช้กับ Swarm
ขีดจำกัดกลุ่ม งบประมาณ และความสามารถในการสังเกตการณ์ทั้งหมดอิงกับกลุ่มตัวรวบรวมแบบแบน

child ทุกตัวมีเจ้าของการรับเข้าเพียงหนึ่งราย child แบบประกาศและแบบโต้ตอบใช้
`agents.defaults.subagents.maxChildrenPerAgent` (ค่าเริ่มต้น `5`) และไม่นับรวม
child แบบตัวรวบรวม child แบบตัวรวบรวมใช้เพียง `maxChildrenPerGroup` และ
`maxTotalPerGroup` เท่านั้น และไม่ใช้โควตา child ต่อเซสชัน กลไกป้องกันความลึกในการสร้าง
ยังคงมีผลกับทั้งสองโหมด

หลังจากได้รับการรับเข้า child ที่เกิน `maxConcurrent` จะเข้าคิวแบบ FIFO ภายในกลุ่ม swarm
ของตน ซึ่งซ้อนอยู่ภายในเลน sub-agent ส่วนกลาง ชั้นภาวะพร้อมกันเหล่านี้จะจัดงาน
เข้าคิวแทนการปฏิเสธ การสร้างตัวรวบรวมที่เกินขีดจำกัดกลุ่มรายการใดรายการหนึ่ง
จะถูกปฏิเสธโดยมีคีย์การกำหนดค่าที่เกี่ยวข้องในข้อผิดพลาด

## สังเกตการณ์ Swarm

เปิดแดชบอร์ดของเซสชัน parent ใน Control UI ขณะที่ swarm กำลังทำงาน
วิดเจ็ต Swarm แสดงแต่ละกลุ่มตัวรวบรวมที่ใช้งานอยู่เป็นหนึ่งจุดต่อ child พร้อม
สถานะเข้าคิว กำลังทำงาน เสร็จสิ้น หรือล้มเหลว ป้ายกำกับจะแสดงในคำแนะนำเครื่องมือของจุด ดังนั้นป้ายกำกับ
ที่สั้นและคงที่ช่วยให้อ่าน swarm ขนาดใหญ่ได้ง่ายขึ้น

แถบด้านข้างของเซสชันยังคงใช้แผนผัง parent/child ตามปกติ ขยายแถว parent
เพื่อตรวจสอบ child แบบตัวรวบรวมหรือเปิดบันทึกการสนทนาโดยไม่สูญเสียลำดับชั้นของ swarm

ผลลัพธ์ของตัวรวบรวมยังคงรอรับได้จนกว่ากลุ่มจะถูกเก็บถาวร หลังจากสมาชิกทุกตัว
ถึงกำหนดเวลาการเก็บรักษา OpenClaw จะเก็บ child ของกลุ่มเป็นชุด
เพื่อไม่ให้ swarm ที่เสร็จสมบูรณ์คงอยู่ในแผนผังเซสชันที่ใช้งานอยู่

## ใช้ Swarm จาก harness อื่น

คุณสามารถใช้ Swarm ได้โดยไม่ต้องใช้โหมดโค้ดของ OpenClaw เครื่องมือหลักของ Swarm
ไม่ขึ้นกับ harness: เริ่ม child แบบตัวรวบรวมด้วย
`sessions_spawn({ collect: true })` และดึงผลลัพธ์ด้วยการเรียก `agents_wait`
แบบมีขอบเขตจำกัด

โหมดโค้ดของ Codex จะเปิดเผยเครื่องมือ OpenClaw แบบไดนามิกที่มีสิทธิ์ใช้งานโดยอัตโนมัติภายใต้
`tools.*` โดยไม่ใช้ guest API ของ QuickJS ของ OpenClaw หรือกำหนดให้ต้องมี
`tools.codeMode` แต่ยังคงต้องเปิดใช้งาน `tools.swarm` การเรียก `agents_wait`
ของ Codex harness รองรับระยะหมดเวลาเต็ม 600 วินาที ใช้รูปแบบนี้:

```javascript
const tasks = [
  "ตรวจสอบเส้นทางการยืนยันตัวตน",
  "ตรวจสอบเส้นทางพื้นที่จัดเก็บ",
  "ตรวจสอบเส้นทางการกู้คืน",
];

const launches = await Promise.all(
  tasks.map((task, index) =>
    tools.sessions_spawn({
      task,
      collect: true,
      label: `review-${index + 1}`,
    }),
  ),
);

for (const launch of launches) {
  if (launch.status !== "accepted") {
    throw new Error(launch.error ?? "ระบบไม่ยอมรับการเริ่มตัวรวบรวม");
  }
}

const pending = new Set(launches.map((launch) => launch.runId));
const completed = [];

while (pending.size > 0) {
  const ids = [...pending].slice(0, 1000);
  const batch = await tools.agents_wait({
    ids,
    timeoutSeconds: 30,
  });

  // หมุนเวียนหน้าต่างแบบมีขอบเขตนี้ไปหลัง id ที่ยังไม่ได้ตรวจสอบ
  for (const runId of ids) {
    if (pending.delete(runId)) pending.add(runId);
  }

  for (const item of batch.completed) {
    pending.delete(item.runId);
    if (item.status !== "done") {
      throw new Error(item.schemaError ?? item.result ?? `${item.runId}: ${item.status}`);
    }
    completed.push(item); // ประมวลผลแต่ละผลลัพธ์ทันทีที่เสร็จสิ้น
  }

  for (const failure of batch.errors ?? []) {
    pending.delete(failure.runId);
    throw new Error(`${failure.runId}: ${failure.error}`);
  }
}

return completed;
```

การเรียก `agents_wait` แต่ละครั้งรับ run id ได้ 1–1000 รายการ และส่งคืน:

```typescript
type AgentsWaitResult = {
  completed: Array<{
    runId: string;
    status: "done" | "failed" | "killed" | "timeout";
    result: string;
    structured?: unknown;
    schemaError?: string;
    sessionKey: string;
    label?: string;
    usage?: { inputTokens: number; outputTokens: number };
  }>;
  pending: string[];
  errors?: Array<{
    runId: string;
    error: "not_found" | "not_owner";
  }>;
};
```

การเรียกจะส่งคืนทันทีเมื่อ child ที่ร้องขอรายการใดรายการหนึ่งเสร็จสมบูรณ์แล้ว
เมื่อ child ที่รอดำเนินการอย่างน้อยหนึ่งรายการเสร็จสมบูรณ์ เมื่อไม่มี id ที่รอดำเนินการและถูกต้องเหลืออยู่
หรือเมื่อหมดเวลา เรกคอร์ดที่เสร็จสมบูรณ์มีคุณสมบัติ idempotent ดังนั้นการส่ง
run id ที่เสร็จสมบูรณ์แล้วจะส่งคืนผลลัพธ์เดิมอีกครั้ง เฉพาะเซสชันที่เริ่มตัวรวบรวม
หรือลำดับ parent ที่ได้รับอนุญาตเท่านั้นที่สามารถรอตัวรวบรวมได้

นี่คือ long polling แบบมีขอบเขตจำกัด ไม่ใช่ลูปตรวจสอบสถานะแบบทำงานต่อเนื่อง ให้ส่งเฉพาะ
run id ที่เหลือต่อไปจนกว่า `pending` จะว่างเปล่า โหมดตัวรวบรวมรองรับ sub-agent
แบบเนทีฟของ OpenClaw แต่ไม่รองรับรันไทม์ ACP, การผูก thread, เซสชันที่มองเห็นได้
หรือโหมดเซสชันถาวร

## ข้อจำกัดและแผนงาน

Swarm v1 เรียกใช้ child แบบตัวรวบรวมครั้งเดียว ส่วน API `agents.session()` ที่วางแผนไว้
จะเพิ่ม worker แบบหลายรอบการโต้ตอบที่มีสถานะ ปัจจุบัน child ทำงานบน lane สำหรับ sub-agent
ของ Gateway ภายในเครื่อง โดยมีแผนเพิ่มการจัดวางบนคลาวด์เป็นตัวเลือกการเริ่มทำงานอย่างชัดเจน
คำจำกัดความเวิร์กโฟลว์ที่บันทึกไว้และ DSL แบบกราฟไม่อยู่ในทิศทางปัจจุบันของ Swarm

## เนื้อหาที่เกี่ยวข้อง

- [โหมดโค้ด](/th/tools/code-mode) สำหรับ guest runtime ของ QuickJS และกฎการเปิดใช้งาน
- [Sub-agent](/th/tools/subagents) สำหรับนโยบายของ child การแยกส่วน และลักษณะการทำงานของเซสชัน
- [เครื่องมือ sandbox สำหรับหลาย agent](/th/tools/multi-agent-sandbox-tools) สำหรับข้อจำกัดราย agent
- [ภาพรวมเครื่องมือ](/th/tools) สำหรับโปรไฟล์เครื่องมือและการกำหนดเส้นทางตามนโยบาย
