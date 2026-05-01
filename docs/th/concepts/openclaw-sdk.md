---
read_when:
    - คุณกำลังสร้างแอปภายนอก สคริปต์ แดชบอร์ด งาน CI หรือส่วนขยาย IDE ที่สื่อสารกับ OpenClaw
    - คุณกำลังเลือกระหว่าง SDK สำหรับแอปกับ SDK สำหรับ Plugin
    - คุณกำลังผสานการทำงานกับการรันเอเจนต์ เซสชัน เหตุการณ์ การอนุมัติ โมเดล หรือเครื่องมือของ Gateway
sidebarTitle: App SDK
summary: OpenClaw App SDK สาธารณะสำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
title: SDK สำหรับแอป OpenClaw
x-i18n:
    generated_at: "2026-05-01T10:16:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6b22e9f4f809a572cfd19fd22f633a706dd23b8bee2f3c244003a0861a41073
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** คือ API ไคลเอนต์สาธารณะสำหรับแอปที่อยู่นอกโปรเซส
OpenClaw ใช้ `@openclaw/sdk` เมื่อสคริปต์ แดชบอร์ด งาน CI ส่วนขยาย IDE
หรือแอปภายนอกอื่นต้องการเชื่อมต่อกับ Gateway, เริ่มการรันของเอเจนต์
สตรีมเหตุการณ์ รอผลลัพธ์ ยกเลิกงาน หรือตรวจสอบทรัพยากรของ Gateway

<Note>
  App SDK แตกต่างจาก [Plugin SDK](/th/plugins/sdk-overview)
  `@openclaw/sdk` สื่อสารกับ Gateway จากภายนอก OpenClaw
  `openclaw/plugin-sdk/*` ใช้เฉพาะสำหรับ plugins ที่ทำงานภายใน OpenClaw และ
  ลงทะเบียนผู้ให้บริการ ช่องทาง เครื่องมือ hooks หรือ trusted runtimes
</Note>

## สิ่งที่มีให้ใช้งานในวันนี้

`@openclaw/sdk` มีสิ่งต่อไปนี้:

| Surface                   | สถานะ | สิ่งที่ทำ                                                                 |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `OpenClaw`                | พร้อมใช้งาน | จุดเริ่มต้นไคลเอนต์หลัก เป็นเจ้าของ transport, การเชื่อมต่อ, requests และ events |
| `GatewayClientTransport`  | พร้อมใช้งาน | WebSocket transport ที่อิงกับไคลเอนต์ Gateway                              |
| `oc.agents`               | พร้อมใช้งาน | แสดงรายการ สร้าง อัปเดต ลบ และรับ handles ของเอเจนต์                      |
| `Agent.run()`             | พร้อมใช้งาน | เริ่มการรัน `agent` ของ Gateway และส่งคืน `Run`                            |
| `oc.runs`                 | พร้อมใช้งาน | สร้าง รับ รอ ยกเลิก และสตรีม runs                                          |
| `Run.events()`            | พร้อมใช้งาน | สตรีม events ต่อ run ที่ถูกทำให้เป็นรูปแบบมาตรฐาน พร้อม replay สำหรับ runs ที่เร็ว |
| `Run.wait()`              | พร้อมใช้งาน | เรียก `agent.wait` และส่งคืน `RunResult` ที่เสถียร                         |
| `Run.cancel()`            | พร้อมใช้งาน | เรียก `sessions.abort` ด้วย run id พร้อม session key เมื่อมี               |
| `oc.sessions`             | พร้อมใช้งาน | สร้าง แก้ไขการอ้างอิง ส่งไปยัง แพตช์ compact และรับ handles ของเซสชัน     |
| `Session.send()`          | พร้อมใช้งาน | เรียก `sessions.send` และส่งคืน `Run`                                      |
| `oc.models`               | พร้อมใช้งาน | เรียก `models.list` และ RPC สถานะ `models.authStatus` ปัจจุบัน             |
| `oc.tools`                | พร้อมใช้งาน | แสดงรายการ กำหนด scope และเรียกใช้เครื่องมือ Gateway ผ่าน policy pipeline |
| `oc.artifacts`            | พร้อมใช้งาน | แสดงรายการ รับ และดาวน์โหลด artifacts ของ transcript จาก Gateway           |
| `oc.approvals`            | พร้อมใช้งาน | แสดงรายการและแก้ไข exec approvals ผ่าน approval RPCs ของ Gateway           |
| `oc.rawEvents()`          | พร้อมใช้งาน | เปิดเผย events ดิบของ Gateway สำหรับผู้ใช้ขั้นสูง                          |
| `normalizeGatewayEvent()` | พร้อมใช้งาน | แปลง events ดิบของ Gateway เป็นรูปแบบ event ของ SDK ที่เสถียร              |

SDK ยัง export types หลักที่ surfaces เหล่านั้นใช้:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` และ
result types ที่เกี่ยวข้อง

## เชื่อมต่อกับ Gateway

สร้างไคลเอนต์ด้วย URL ของ Gateway ที่ระบุชัดเจน หรือฉีด custom transport สำหรับ
tests และ embedded app runtimes

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
`gateway: "auto"` ถูก constructor ยอมรับ แต่การค้นหา Gateway อัตโนมัติ
ยังไม่ใช่ฟีเจอร์ SDK แยกต่างหากในตอนนี้ ให้ส่ง `url` เมื่อแอปยังไม่รู้วิธี
ค้นหา Gateway อยู่แล้ว

สำหรับ tests ให้ส่ง object ที่ implements `OpenClawTransport`:

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

model refs ที่ระบุ provider เช่น `openai/gpt-5.5` จะถูกแยกเป็น overrides
`provider` และ `model` ของ Gateway `timeoutMs` ยังคงเป็นมิลลิวินาทีใน SDK และ
ถูกแปลงเป็น timeout หน่วยวินาทีของ Gateway สำหรับ RPC `agent`

`run.wait()` ใช้ RPC `agent.wait` ของ Gateway กำหนดเวลารอที่หมดอายุขณะที่ run
ยังทำงานอยู่จะส่งคืน `status: "accepted"` แทนที่จะทำเสมือนว่า run นั้น timeout
เอง Runtime timeouts, runs ที่ถูก abort และ runs ที่ถูกยกเลิกจะถูกทำให้เป็น
รูปแบบมาตรฐานเป็น `timed_out` หรือ `cancelled`

## สร้างและใช้ Sessions ซ้ำ

ใช้ sessions เมื่อแอปต้องการสถานะ transcript ที่คงอยู่

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` เรียก `sessions.send` และส่งคืน `Run` handles ของเซสชันยัง
รองรับ:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## สตรีม Events

SDK ทำให้ events ดิบของ Gateway เป็น envelope `OpenClawEvent` ที่เสถียร:

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

ประเภท event ที่พบบ่อยได้แก่:

| ประเภท event          | event ต้นทางของ Gateway                    |
| --------------------- | ------------------------------------------- |
| `run.started`         | การเริ่ม lifecycle ของ `agent`              |
| `run.completed`       | การสิ้นสุด lifecycle ของ `agent`            |
| `run.failed`          | ข้อผิดพลาด lifecycle ของ `agent`            |
| `run.cancelled`       | การสิ้นสุด lifecycle ที่ถูก abort/cancelled |
| `run.timed_out`       | การสิ้นสุด lifecycle จาก timeout            |
| `assistant.delta`     | streaming delta ของ assistant               |
| `assistant.message`   | ข้อความของ assistant                        |
| `thinking.delta`      | สตรีมความคิดหรือแผน                         |
| `tool.call.started`   | การเริ่ม tool/item/command                  |
| `tool.call.delta`     | การอัปเดต tool/item/command                 |
| `tool.call.completed` | การเสร็จสิ้น tool/item/command              |
| `tool.call.failed`    | ความล้มเหลวของ tool/item/command หรือสถานะถูกบล็อก |
| `approval.requested`  | คำขออนุมัติ exec หรือ plugin                |
| `approval.resolved`   | การแก้ไขการอนุมัติ exec หรือ plugin         |
| `session.created`     | การสร้างจาก `sessions.changed`              |
| `session.updated`     | การอัปเดตจาก `sessions.changed`             |
| `session.compacted`   | Compaction จาก `sessions.changed`           |
| `task.updated`        | events การอัปเดต task                       |
| `artifact.updated`    | events ของ patch stream                     |
| `raw`                 | event ใดก็ตามที่ยังไม่มี mapping SDK ที่เสถียร |

`Run.events()` กรอง events ให้เหลือ run id เดียวและ replay events ที่เห็นแล้ว
สำหรับ runs ที่เร็ว ซึ่งหมายความว่า flow ที่บันทึกไว้ในเอกสารนี้ปลอดภัย:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

สำหรับ streams ระดับทั้งแอป ให้ใช้ `oc.events()` สำหรับ frames ดิบของ Gateway
ให้ใช้ `oc.rawEvents()`

## Models, Tools, Artifacts และ Approvals

ตัวช่วย model map ไปยัง methods ปัจจุบันของ Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

ตัวช่วย tool เปิดเผย catalog ของ Gateway, มุมมอง tool ที่มีผล และการเรียกใช้
Gateway tool โดยตรง `oc.tools.invoke()` ส่งคืน envelope ที่มี type แทนการ throw
สำหรับการปฏิเสธจาก policy หรือ approval

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

ตัวช่วย artifact เปิดเผย projection ของ artifact ใน Gateway สำหรับ context ของ
session, run หรือ task แต่ละ call ต้องมี scope `sessionKey`, `runId` หรือ
`taskId` อย่างใดอย่างหนึ่งที่ระบุชัดเจน:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

ตัวช่วย approval ใช้ RPCs สำหรับ exec approval:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## สิ่งที่ยังไม่รองรับอย่างชัดเจนในวันนี้

SDK มีชื่อสำหรับ product model ที่เราต้องการ แต่จะไม่ทำเสมือนว่า Gateway RPCs
มีอยู่โดยเงียบ ๆ calls เหล่านี้ในตอนนี้จะ throw ข้อผิดพลาด unsupported
อย่างชัดเจน:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

ฟิลด์ `workspace`, `runtime`, `environment` และ `approvals` ต่อ run ถูกกำหนด
type เป็นรูปแบบอนาคต แต่ Gateway ปัจจุบันไม่รองรับ overrides เหล่านั้นบน RPC
`agent` หาก callers ส่งค่าเหล่านี้ SDK จะ throw ก่อนส่ง run เพื่อไม่ให้งาน
ถูก execute โดยไม่ตั้งใจด้วยพฤติกรรม workspace, runtime, environment หรือ
approval แบบค่าเริ่มต้น

## App SDK เทียบกับ Plugin SDK

ใช้ App SDK เมื่อโค้ดอยู่นอก OpenClaw:

- สคริปต์ Node ที่เริ่มหรือสังเกตการรันของเอเจนต์
- งาน CI ที่เรียก Gateway
- แดชบอร์ดและแผงผู้ดูแลระบบ
- ส่วนขยาย IDE
- bridges ภายนอกที่ไม่จำเป็นต้องกลายเป็น channel plugins
- integration tests ด้วย Gateway transports ปลอมหรือจริง

ใช้ Plugin SDK เมื่อโค้ดทำงานภายใน OpenClaw:

- provider plugins
- channel plugins
- hooks สำหรับ tool หรือ lifecycle
- agent harness plugins
- trusted runtime helpers

โค้ด App SDK ควร import จาก `@openclaw/sdk` โค้ด Plugin ควร import จาก
subpaths `openclaw/plugin-sdk/*` ที่บันทึกไว้ในเอกสาร อย่าผสมสอง contracts นี้

## เอกสารที่เกี่ยวข้อง

- [การออกแบบ API ของ OpenClaw App SDK](/th/reference/openclaw-sdk-api-design)
- [ข้อมูลอ้างอิง RPC ของ Gateway](/th/reference/rpc)
- [Agent loop](/th/concepts/agent-loop)
- [Agent runtimes](/th/concepts/agent-runtimes)
- [Sessions](/th/concepts/session)
- [Background tasks](/th/automation/tasks)
- [ACP agents](/th/tools/acp-agents)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
