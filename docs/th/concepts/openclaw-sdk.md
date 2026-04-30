---
read_when:
    - คุณกำลังสร้างแอปภายนอก สคริปต์ แดชบอร์ด งาน CI หรือส่วนขยาย IDE ที่สื่อสารกับ OpenClaw
    - คุณกำลังเลือกระหว่าง App SDK และ Plugin SDK
    - คุณกำลังผสานการทำงานกับการรันเอเจนต์ เซสชัน เหตุการณ์ การอนุมัติ โมเดล หรือเครื่องมือของ Gateway
sidebarTitle: App SDK
summary: SDK แอป OpenClaw สาธารณะสำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
title: SDK แอป OpenClaw
x-i18n:
    generated_at: "2026-04-30T09:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** คือ API ไคลเอนต์สาธารณะสำหรับแอปที่อยู่นอกโปรเซสของ
OpenClaw ใช้ `@openclaw/sdk` เมื่อสคริปต์ แดชบอร์ด งาน CI ส่วนขยาย IDE
หรือแอปภายนอกอื่นต้องการเชื่อมต่อกับ Gateway, เริ่มการรันของเอเจนต์,
สตรีมอีเวนต์, รอผลลัพธ์, ยกเลิกงาน หรือตรวจสอบทรัพยากรของ Gateway

<Note>
  App SDK แตกต่างจาก [Plugin SDK](/th/plugins/sdk-overview)
  `@openclaw/sdk` คุยกับ Gateway จากภายนอก OpenClaw
  `openclaw/plugin-sdk/*` ใช้สำหรับ Plugin ที่รันอยู่ภายใน OpenClaw เท่านั้น และ
  ลงทะเบียนผู้ให้บริการ ช่องทาง เครื่องมือ hooks หรือรันไทม์ที่เชื่อถือได้
</Note>

## สิ่งที่มีให้ในวันนี้

`@openclaw/sdk` มาพร้อมกับ:

| พื้นผิว                  | สถานะ       | สิ่งที่ทำ                                                                    |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | พร้อมใช้งาน | จุดเข้าใช้งานหลักของไคลเอนต์ เป็นเจ้าของ transport, การเชื่อมต่อ, คำขอ และอีเวนต์ |
| `GatewayClientTransport`  | พร้อมใช้งาน | WebSocket transport ที่รองรับโดยไคลเอนต์ Gateway                             |
| `oc.agents`               | พร้อมใช้งาน | แสดงรายการ สร้าง อัปเดต ลบ และรับ handle ของเอเจนต์                         |
| `Agent.run()`             | พร้อมใช้งาน | เริ่มการรัน Gateway `agent` และคืนค่า `Run`                                  |
| `oc.runs`                 | พร้อมใช้งาน | สร้าง รับ รอ ยกเลิก และสตรีมการรัน                                          |
| `Run.events()`            | พร้อมใช้งาน | สตรีมอีเวนต์ต่อการรันที่ปรับรูปแบบแล้ว พร้อม replay สำหรับการรันที่เร็ว     |
| `Run.wait()`              | พร้อมใช้งาน | เรียก `agent.wait` และคืนค่า `RunResult` ที่เสถียร                           |
| `Run.cancel()`            | พร้อมใช้งาน | เรียก `sessions.abort` ด้วย run id พร้อม session key เมื่อมีให้ใช้งาน        |
| `oc.sessions`             | พร้อมใช้งาน | สร้าง resolve ส่งไปยัง แพตช์ compact และรับ handle ของเซสชัน                |
| `Session.send()`          | พร้อมใช้งาน | เรียก `sessions.send` และคืนค่า `Run`                                        |
| `oc.models`               | พร้อมใช้งาน | เรียก `models.list` และ RPC สถานะ `models.authStatus` ปัจจุบัน               |
| `oc.tools`                | บางส่วน | แสดงรายการแค็ตตาล็อกเครื่องมือและเครื่องมือที่มีผลจริง; ยังไม่ได้ต่อการเรียกใช้เครื่องมือโดยตรง |
| `oc.approvals`            | พร้อมใช้งาน | แสดงรายการและ resolve การอนุมัติ exec ผ่าน RPC การอนุมัติของ Gateway        |
| `oc.rawEvents()`          | พร้อมใช้งาน | เปิดเผยอีเวนต์ Gateway แบบดิบสำหรับผู้ใช้งานขั้นสูง                         |
| `normalizeGatewayEvent()` | พร้อมใช้งาน | แปลงอีเวนต์ Gateway แบบดิบให้เป็นรูปแบบอีเวนต์ SDK ที่เสถียร                |

SDK ยัง export ชนิดหลักที่พื้นผิวเหล่านั้นใช้:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` และชนิดผลลัพธ์ที่เกี่ยวข้อง

## เชื่อมต่อกับ Gateway

สร้างไคลเอนต์ด้วย URL ของ Gateway ที่ระบุชัดเจน หรือฉีด transport แบบกำหนดเองสำหรับ
การทดสอบและรันไทม์แอปแบบฝัง

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` เทียบเท่ากับ `url` ตัวเลือก
`gateway: "auto"` ถูก constructor รับได้ แต่การค้นหา Gateway อัตโนมัติยังไม่ใช่
ฟีเจอร์ SDK แยกต่างหาก; ส่ง `url` เมื่อแอปยังไม่รู้วิธีค้นหา Gateway อยู่แล้ว

สำหรับการทดสอบ ให้ส่งออบเจ็กต์ที่ implement `OpenClawTransport`:

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## รันเอเจนต์

ใช้ `oc.agents.get(id)` เมื่อแอปต้องการ handle ของเอเจนต์ จากนั้นเรียก
`agent.run()`

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

model ref ที่ระบุ provider เช่น `openai/gpt-5.5` จะถูกแยกเป็น override ของ Gateway
สำหรับ `provider` และ `model` ค่า `timeoutMs` ยังเป็นมิลลิวินาทีใน SDK และ
จะถูกแปลงเป็นวินาที timeout ของ Gateway สำหรับ RPC `agent`

`run.wait()` ใช้ RPC `agent.wait` ของ Gateway กำหนดเวลารอที่หมดอายุ
ขณะที่การรันยัง active จะคืนค่า `status: "accepted"` แทนการแกล้งทำเหมือนว่า
การรันเองหมดเวลา timeout ของรันไทม์ การรันที่ถูก abort และการรันที่ถูกยกเลิกจะถูก
ปรับรูปแบบเป็น `timed_out` หรือ `cancelled`

## สร้างและใช้เซสชันซ้ำ

ใช้เซสชันเมื่อแอปต้องการสถานะ transcript ที่คงทน

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` เรียก `sessions.send` และคืนค่า `Run` handle ของเซสชันยัง
รองรับ:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## สตรีมอีเวนต์

SDK ปรับรูปแบบอีเวนต์ Gateway แบบดิบให้เป็น envelope `OpenClawEvent` ที่เสถียร:

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

ชนิดอีเวนต์ทั่วไปประกอบด้วย:

| ชนิดอีเวนต์            | อีเวนต์ Gateway ต้นทาง                    |
| --------------------- | ------------------------------------------- |
| `run.started`         | การเริ่ม lifecycle ของ `agent`             |
| `run.completed`       | การสิ้นสุด lifecycle ของ `agent`           |
| `run.failed`          | ข้อผิดพลาด lifecycle ของ `agent`           |
| `run.cancelled`       | การสิ้นสุด lifecycle แบบ abort/ยกเลิก      |
| `run.timed_out`       | การสิ้นสุด lifecycle แบบ timeout           |
| `assistant.delta`     | streaming delta ของผู้ช่วย                 |
| `assistant.message`   | ข้อความของผู้ช่วย                          |
| `thinking.delta`      | สตรีมการคิดหรือแผน                         |
| `tool.call.started`   | การเริ่มเครื่องมือ/รายการ/คำสั่ง           |
| `tool.call.delta`     | การอัปเดตเครื่องมือ/รายการ/คำสั่ง          |
| `tool.call.completed` | การเสร็จสิ้นเครื่องมือ/รายการ/คำสั่ง       |
| `tool.call.failed`    | ความล้มเหลวของเครื่องมือ/รายการ/คำสั่ง หรือสถานะถูกบล็อก |
| `approval.requested`  | คำขออนุมัติ exec หรือ Plugin               |
| `approval.resolved`   | การ resolve การอนุมัติ exec หรือ Plugin    |
| `session.created`     | การสร้างจาก `sessions.changed`             |
| `session.updated`     | การอัปเดตจาก `sessions.changed`            |
| `session.compacted`   | Compaction จาก `sessions.changed`           |
| `task.updated`        | อีเวนต์อัปเดตงาน                           |
| `artifact.updated`    | อีเวนต์สตรีมแพตช์                          |
| `raw`                 | อีเวนต์ใดๆ ที่ยังไม่มี mapping SDK ที่เสถียร |

`Run.events()` กรองอีเวนต์ให้เหลือ run id เดียวและ replay อีเวนต์ที่เคยเห็นแล้วสำหรับ
การรันที่เร็ว ซึ่งหมายความว่า flow ที่บันทึกไว้ในเอกสารนั้นปลอดภัย:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

สำหรับสตรีมทั้งแอป ให้ใช้ `oc.events()` สำหรับเฟรม Gateway แบบดิบ ให้ใช้
`oc.rawEvents()`

## โมเดล เครื่องมือ และการอนุมัติ

ตัวช่วยโมเดล map ไปยังเมธอด Gateway ปัจจุบัน:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

ตัวช่วยเครื่องมือเปิดเผยแค็ตตาล็อก Gateway และมุมมองเครื่องมือที่มีผลจริง:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

ตัวช่วยการอนุมัติใช้ RPC การอนุมัติ exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## ยังไม่รองรับอย่างชัดเจนในวันนี้

SDK รวมชื่อสำหรับโมเดลผลิตภัณฑ์ที่เราต้องการไว้ แต่จะไม่แกล้งทำเงียบๆ ว่า
มี RPC ของ Gateway อยู่ การเรียกเหล่านี้ตอนนี้ throw ข้อผิดพลาดว่าไม่รองรับอย่างชัดเจน:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

ฟิลด์ต่อการรัน `workspace`, `runtime`, `environment` และ `approvals` ถูกกำหนดชนิด
เป็นรูปแบบในอนาคต แต่ Gateway ปัจจุบันไม่รองรับ override เหล่านั้นบน
RPC `agent` หาก caller ส่งมา SDK จะ throw ก่อน submit การรัน
เพื่อไม่ให้งานถูก execute โดยไม่ตั้งใจด้วยพฤติกรรม workspace, runtime,
environment หรือ approval ค่าเริ่มต้น

## App SDK เทียบกับ Plugin SDK

ใช้ App SDK เมื่อโค้ดอยู่นอก OpenClaw:

- สคริปต์ Node ที่เริ่มหรือสังเกตการรันของเอเจนต์
- งาน CI ที่เรียก Gateway
- แดชบอร์ดและแผงผู้ดูแล
- ส่วนขยาย IDE
- bridge ภายนอกที่ไม่จำเป็นต้องกลายเป็น channel Plugin
- การทดสอบ integration ด้วย transport ของ Gateway แบบปลอมหรือจริง

ใช้ Plugin SDK เมื่อโค้ดรันอยู่ภายใน OpenClaw:

- provider Plugin
- channel Plugin
- hook ของเครื่องมือหรือ lifecycle
- agent harness Plugin
- ตัวช่วยรันไทม์ที่เชื่อถือได้

โค้ด App SDK ควร import จาก `@openclaw/sdk` โค้ด Plugin ควร import จาก
subpath `openclaw/plugin-sdk/*` ที่มีเอกสารกำกับไว้ อย่าผสมสัญญาทั้งสองแบบเข้าด้วยกัน

## เอกสารที่เกี่ยวข้อง

- [การออกแบบ API ของ OpenClaw App SDK](/th/reference/openclaw-sdk-api-design)
- [เอกสารอ้างอิง RPC ของ Gateway](/th/reference/rpc)
- [ลูปเอเจนต์](/th/concepts/agent-loop)
- [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)
- [เซสชัน](/th/concepts/session)
- [งานเบื้องหลัง](/th/automation/tasks)
- [เอเจนต์ ACP](/th/tools/acp-agents)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
