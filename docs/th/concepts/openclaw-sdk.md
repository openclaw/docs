---
read_when:
    - คุณกำลังสร้างแอปภายนอก สคริปต์ แดชบอร์ด งาน CI หรือส่วนขยาย IDE ที่สื่อสารกับ OpenClaw
    - คุณกำลังเลือกระหว่าง SDK สำหรับแอปกับ SDK สำหรับ Plugin
    - คุณกำลังผสานรวมกับการรันเอเจนต์ของ Gateway, เซสชัน, เหตุการณ์, การอนุมัติ, โมเดล หรือเครื่องมือ
sidebarTitle: App SDK
summary: SDK แอป OpenClaw สาธารณะสำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
title: OpenClaw SDK สำหรับแอป
x-i18n:
    generated_at: "2026-05-10T19:34:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc339e9f29dd1297353d85827dbac207311a9633e1ab6cc47dace80a72259356
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** คือ API ไคลเอนต์สาธารณะสำหรับแอปที่อยู่นอกกระบวนการ
OpenClaw ใช้ `@openclaw/sdk` เมื่อสคริปต์ แดชบอร์ด งาน CI ส่วนขยาย IDE
หรือแอปภายนอกอื่นต้องการเชื่อมต่อกับ Gateway, เริ่มการรันของเอเจนต์,
สตรีมอีเวนต์, รอผลลัพธ์, ยกเลิกงาน หรือตรวจสอบทรัพยากรของ Gateway

<Note>
  App SDK แตกต่างจาก [Plugin SDK](/th/plugins/sdk-overview)
  `@openclaw/sdk` คุยกับ Gateway จากภายนอก OpenClaw
  `openclaw/plugin-sdk/*` ใช้สำหรับ Plugin ที่รันอยู่ภายใน OpenClaw เท่านั้น และ
  ลงทะเบียนผู้ให้บริการ ช่องทาง เครื่องมือ ฮุก หรือรันไทม์ที่เชื่อถือได้
</Note>

## สิ่งที่มีให้วันนี้

`@openclaw/sdk` มาพร้อมกับ:

| ส่วนติดต่อ                 | สถานะ       | ทำอะไร                                                                            |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | พร้อมใช้งาน | จุดเริ่มต้นไคลเอนต์หลัก ดูแลทรานสปอร์ต การเชื่อมต่อ คำขอ และอีเวนต์             |
| `GatewayClientTransport`  | พร้อมใช้งาน | ทรานสปอร์ต WebSocket ที่รองรับโดยไคลเอนต์ Gateway                                 |
| `oc.agents`               | พร้อมใช้งาน | แสดงรายการ สร้าง อัปเดต ลบ และรับแฮนเดิลเอเจนต์                                  |
| `Agent.run()`             | พร้อมใช้งาน | เริ่มการรัน Gateway `agent` และคืนค่า `Run`                                       |
| `oc.runs`                 | พร้อมใช้งาน | สร้าง รับ รอ ยกเลิก และสตรีมการรัน                                                |
| `Run.events()`            | พร้อมใช้งาน | สตรีมอีเวนต์ต่อการรันที่ถูกปรับให้อยู่ในรูปแบบมาตรฐาน พร้อมรีเพลย์สำหรับการรันที่เร็ว |
| `Run.wait()`              | พร้อมใช้งาน | เรียก `agent.wait` และคืนค่า `RunResult` ที่เสถียร                                |
| `Run.cancel()`            | พร้อมใช้งาน | เรียก `sessions.abort` ด้วยรหัสการรัน พร้อมคีย์เซสชันเมื่อมี                      |
| `oc.sessions`             | พร้อมใช้งาน | สร้าง แก้ไข ส่งไปยัง แพตช์ Compaction และรับแฮนเดิลเซสชัน                       |
| `Session.send()`          | พร้อมใช้งาน | เรียก `sessions.send` และคืนค่า `Run`                                             |
| `oc.tasks`                | พร้อมใช้งาน | แสดงรายการ อ่าน และยกเลิกรายการบัญชีแยกประเภทงานของ Gateway                    |
| `oc.models`               | พร้อมใช้งาน | เรียก `models.list` และ RPC สถานะ `models.authStatus` ปัจจุบัน                    |
| `oc.tools`                | พร้อมใช้งาน | แสดงรายการ กำหนดขอบเขต และเรียกใช้เครื่องมือ Gateway ผ่านไปป์ไลน์นโยบาย          |
| `oc.artifacts`            | พร้อมใช้งาน | แสดงรายการ รับ และดาวน์โหลดอาร์ทิแฟกต์ทรานสคริปต์ของ Gateway                    |
| `oc.approvals`            | พร้อมใช้งาน | แสดงรายการและแก้ไขการอนุมัติ exec ผ่าน RPC การอนุมัติของ Gateway                |
| `oc.environments`         | บางส่วน | แสดงรายการตัวเลือกสภาพแวดล้อมแบบ Gateway-local และโหนด; create/delete ยังไม่ได้เชื่อมต่อ |
| `oc.rawEvents()`          | พร้อมใช้งาน | เปิดเผยอีเวนต์ Gateway ดิบสำหรับผู้บริโภคขั้นสูง                                  |
| `normalizeGatewayEvent()` | พร้อมใช้งาน | แปลงอีเวนต์ Gateway ดิบเป็นรูปแบบอีเวนต์ SDK ที่เสถียร                           |

SDK ยังส่งออกชนิดหลักที่ใช้โดยส่วนติดต่อเหล่านั้น:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`,
`TaskSummary`, `TaskStatus`, `TasksListParams`, `TasksListResult`,
`TasksGetResult`, `TasksCancelResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` และชนิดผลลัพธ์ที่เกี่ยวข้อง

## เชื่อมต่อกับ Gateway

สร้างไคลเอนต์ด้วย URL ของ Gateway ที่ระบุชัดเจน หรือใส่ทรานสปอร์ตแบบกำหนดเองสำหรับ
การทดสอบและรันไทม์แอปแบบฝังตัว

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` เทียบเท่ากับ `url` ตัวเลือก
`gateway: "auto"` ได้รับการยอมรับโดยคอนสตรักเตอร์ แต่การค้นหา Gateway อัตโนมัติ
ยังไม่ใช่ฟีเจอร์ SDK แยกต่างหาก; ให้ส่ง `url` เมื่อแอปยังไม่รู้วิธีค้นหา Gateway

สำหรับการทดสอบ ให้ส่งออบเจ็กต์ที่อิมพลีเมนต์ `OpenClawTransport`:

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

ใช้ `oc.agents.get(id)` เมื่อแอปต้องการแฮนเดิลเอเจนต์ จากนั้นเรียก
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

refs ของโมเดลที่ระบุผู้ให้บริการ เช่น `openai/gpt-5.5` จะถูกแยกเป็นการ override
`provider` และ `model` ของ Gateway `timeoutMs` ยังคงเป็นมิลลิวินาทีใน SDK และ
ถูกแปลงเป็นวินาทีของ timeout ของ Gateway สำหรับ RPC `agent`

`run.wait()` ใช้ RPC `agent.wait` ของ Gateway กำหนดเวลารอที่หมดอายุขณะที่การรัน
ยังทำงานอยู่จะคืนค่า `status: "accepted"` แทนการทำเหมือนว่าการรันเองหมดเวลา
timeout ของรันไทม์ การรันที่ถูก abort และการรันที่ถูกยกเลิกจะถูกปรับให้อยู่ในรูปแบบ
`timed_out` หรือ `cancelled`

## สร้างและใช้เซสชันซ้ำ

ใช้เซสชันเมื่อแอปต้องการสถานะทรานสคริปต์ที่คงทน

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` เรียก `sessions.send` และคืนค่า `Run` แฮนเดิลเซสชันยังรองรับ:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## สตรีมอีเวนต์

SDK ปรับอีเวนต์ Gateway ดิบให้อยู่ในซอง `OpenClawEvent` ที่เสถียร:

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

| ชนิดอีเวนต์            | อีเวนต์ Gateway ต้นทาง                     |
| --------------------- | ------------------------------------------- |
| `run.started`         | จุดเริ่มต้น lifecycle ของ `agent`           |
| `run.completed`       | จุดสิ้นสุด lifecycle ของ `agent`            |
| `run.failed`          | ข้อผิดพลาด lifecycle ของ `agent`            |
| `run.cancelled`       | จุดสิ้นสุด lifecycle ที่ถูก abort/ยกเลิก    |
| `run.timed_out`       | จุดสิ้นสุด lifecycle เนื่องจาก timeout      |
| `assistant.delta`     | delta การสตรีมของผู้ช่วย                    |
| `assistant.message`   | ข้อความของผู้ช่วย                           |
| `thinking.delta`      | สตรีมการคิดหรือแผน                          |
| `tool.call.started`   | จุดเริ่มต้นเครื่องมือ/รายการ/คำสั่ง         |
| `tool.call.delta`     | การอัปเดตเครื่องมือ/รายการ/คำสั่ง           |
| `tool.call.completed` | การเสร็จสมบูรณ์ของเครื่องมือ/รายการ/คำสั่ง |
| `tool.call.failed`    | ความล้มเหลวหรือสถานะถูกบล็อกของเครื่องมือ/รายการ/คำสั่ง |
| `approval.requested`  | คำขออนุมัติ exec หรือ Plugin                |
| `approval.resolved`   | การแก้ไขผลอนุมัติ exec หรือ Plugin          |
| `session.created`     | การสร้าง `sessions.changed`                 |
| `session.updated`     | การอัปเดต `sessions.changed`                |
| `session.compacted`   | Compaction ของ `sessions.changed`           |
| `task.updated`        | อีเวนต์อัปเดตงาน                            |
| `artifact.updated`    | อีเวนต์สตรีมแพตช์                           |
| `raw`                 | อีเวนต์ใดๆ ที่ยังไม่มีการแมป SDK ที่เสถียร  |

`Run.events()` กรองอีเวนต์ให้เหลือรหัสการรันเดียว และรีเพลย์อีเวนต์ที่เห็นแล้วสำหรับ
การรันที่เร็ว ซึ่งหมายความว่าโฟลว์ที่บันทึกไว้ปลอดภัย:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

สำหรับสตรีมทั้งแอป ให้ใช้ `oc.events()` สำหรับเฟรม Gateway ดิบ ให้ใช้
`oc.rawEvents()`

## โมเดล เครื่องมือ อาร์ทิแฟกต์ และการอนุมัติ

ตัวช่วยโมเดลแมปกับเมธอด Gateway ปัจจุบัน:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

ตัวช่วยเครื่องมือเปิดเผยแค็ตตาล็อก Gateway, มุมมองเครื่องมือที่มีผล และการเรียกใช้
เครื่องมือ Gateway โดยตรง `oc.tools.invoke()` คืนค่าซองที่มีชนิด แทนการโยนข้อผิดพลาด
เมื่อถูกปฏิเสธโดยนโยบายหรือการอนุมัติ

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

ตัวช่วยอาร์ทิแฟกต์เปิดเผยการฉายอาร์ทิแฟกต์ของ Gateway สำหรับบริบทเซสชัน การรัน หรือ
งาน การเรียกแต่ละครั้งต้องมีขอบเขต `sessionKey`, `runId` หรือ
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

ตัวช่วยการอนุมัติใช้ RPC การอนุมัติ exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

ตัวช่วยงานใช้บัญชีแยกประเภทงานแบบคงทน ซึ่งเป็นฐานให้ `openclaw tasks` ด้วย:

```typescript
const tasks = await oc.tasks.list({ status: "running", sessionKey: "agent:main:main" });
const task = await oc.tasks.get(tasks.tasks[0].id);
await oc.tasks.cancel(task.task.id, { reason: "user stopped task" });
```

ตัวช่วยสภาพแวดล้อมเปิดเผยการค้นหาแบบอ่านอย่างเดียวสำหรับ Gateway-local และโหนด:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## สิ่งที่ไม่รองรับอย่างชัดเจนในวันนี้

SDK รวมชื่อสำหรับโมเดลผลิตภัณฑ์ที่เราต้องการ แต่จะไม่แกล้งทำเงียบๆ ว่า RPC ของ
Gateway มีอยู่ การเรียกเหล่านี้ปัจจุบันจะโยนข้อผิดพลาด unsupported อย่างชัดเจน:

```typescript
await oc.environments.create({});
await oc.environments.delete("environment-id");
```

ฟิลด์ `workspace`, `runtime`, `environment` และ `approvals` ต่อการรันถูกกำหนดชนิด
เป็นรูปแบบในอนาคต แต่ Gateway ปัจจุบันยังไม่รองรับการ override เหล่านั้นบน RPC
`agent` หากผู้เรียกส่งฟิลด์เหล่านี้ SDK จะโยนข้อผิดพลาดก่อนส่งการรัน เพื่อไม่ให้งาน
ถูกดำเนินการโดยไม่ตั้งใจด้วยพฤติกรรม workspace, runtime, environment หรือ approval
ค่าเริ่มต้น

## App SDK เทียบกับ Plugin SDK

ใช้ App SDK เมื่อโค้ดอยู่นอก OpenClaw:

- สคริปต์ Node ที่เริ่มหรือสังเกตการรันของเอเจนต์
- งาน CI ที่เรียก Gateway
- แดชบอร์ดและแผงผู้ดูแล
- ส่วนขยาย IDE
- บริดจ์ภายนอกที่ไม่จำเป็นต้องกลายเป็น Plugin ช่องทาง
- การทดสอบอินทิเกรชันด้วยทรานสปอร์ต Gateway ปลอมหรือจริง

ใช้ Plugin SDK เมื่อโค้ดรันอยู่ภายใน OpenClaw:

- Plugin ผู้ให้บริการ
- Plugin ช่องทาง
- ฮุกเครื่องมือหรือ lifecycle
- Plugin ฮาร์เนสเอเจนต์
- ตัวช่วยรันไทม์ที่เชื่อถือได้

โค้ด App SDK ควร import จาก `@openclaw/sdk` โค้ด Plugin ควร import จาก
subpath `openclaw/plugin-sdk/*` ที่บันทึกไว้ในเอกสาร อย่าผสมสัญญาทั้งสองนี้

## ที่เกี่ยวข้อง

- [การออกแบบ API ของ OpenClaw App SDK](/th/reference/openclaw-sdk-api-design)
- [เอกสารอ้างอิง RPC ของ Gateway](/th/reference/rpc)
- [ลูปของเอเจนต์](/th/concepts/agent-loop)
- [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)
- [เซสชัน](/th/concepts/session)
- [งานเบื้องหลัง](/th/automation/tasks)
- [เอเจนต์ ACP](/th/tools/acp-agents)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
