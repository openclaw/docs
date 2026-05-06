---
read_when:
    - คุณกำลังสร้างแอปภายนอก สคริปต์ แดชบอร์ด งาน CI หรือส่วนขยาย IDE ที่สื่อสารกับ OpenClaw
    - คุณกำลังเลือกระหว่าง App SDK และ Plugin SDK
    - คุณกำลังผสานการทำงานกับการรันเอเจนต์ เซสชัน เหตุการณ์ การอนุมัติ โมเดล หรือเครื่องมือของ Gateway
sidebarTitle: App SDK
summary: SDK แอป OpenClaw แบบสาธารณะสำหรับแอปภายนอก สคริปต์ แดชบอร์ด งาน CI และส่วนขยาย IDE
title: SDK แอป OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:09:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** คือ API ไคลเอนต์สาธารณะสำหรับแอปที่อยู่นอกโปรเซสของ
OpenClaw ใช้ `@openclaw/sdk` เมื่อสคริปต์ แดชบอร์ด งาน CI ส่วนขยาย IDE
หรือแอปภายนอกอื่นต้องการเชื่อมต่อกับ Gateway, เริ่มการรันเอเจนต์, สตรีมเหตุการณ์, รอผลลัพธ์, ยกเลิกงาน หรือตรวจสอบทรัพยากรของ Gateway

<Note>
  App SDK แตกต่างจาก [Plugin SDK](/th/plugins/sdk-overview)
  `@openclaw/sdk` คุยกับ Gateway จากภายนอก OpenClaw
  `openclaw/plugin-sdk/*` ใช้สำหรับ plugins ที่รันภายใน OpenClaw และ
  ลงทะเบียนผู้ให้บริการ ช่องทาง เครื่องมือ hooks หรือ trusted runtimes เท่านั้น
</Note>

## สิ่งที่จัดส่งในวันนี้

`@openclaw/sdk` มาพร้อมกับ:

| พื้นผิว                  | สถานะ       | สิ่งที่ทำ                                                                       |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | พร้อมใช้งาน   | จุดเข้าหลักของไคลเอนต์ จัดการ transport, การเชื่อมต่อ, คำขอ และเหตุการณ์        |
| `GatewayClientTransport`  | พร้อมใช้งาน   | WebSocket transport ที่รองรับโดยไคลเอนต์ Gateway                                 |
| `oc.agents`               | พร้อมใช้งาน   | แสดงรายการ สร้าง อัปเดต ลบ และรับ handles ของเอเจนต์                         |
| `Agent.run()`             | พร้อมใช้งาน   | เริ่มการรัน Gateway `agent` และส่งคืน `Run`                                 |
| `oc.runs`                 | พร้อมใช้งาน   | สร้าง รับ รอ ยกเลิก และสตรีมการรัน                              |
| `Run.events()`            | พร้อมใช้งาน   | สตรีมเหตุการณ์ต่อการรันที่ทำให้เป็นมาตรฐาน พร้อม replay สำหรับการรันที่เร็ว                      |
| `Run.wait()`              | พร้อมใช้งาน   | เรียก `agent.wait` และส่งคืน `RunResult` ที่เสถียร                              |
| `Run.cancel()`            | พร้อมใช้งาน   | เรียก `sessions.abort` ตาม run id พร้อม session key เมื่อมี                |
| `oc.sessions`             | พร้อมใช้งาน   | สร้าง แปลงค่า ส่งไปยัง patch ทำ compact และรับ handles ของเซสชัน         |
| `Session.send()`          | พร้อมใช้งาน   | เรียก `sessions.send` และส่งคืน `Run`                                        |
| `oc.models`               | พร้อมใช้งาน   | เรียก `models.list` และ RPC สถานะ `models.authStatus` ปัจจุบัน               |
| `oc.tools`                | พร้อมใช้งาน   | แสดงรายการ กำหนดขอบเขต และเรียกใช้เครื่องมือ Gateway ผ่าน policy pipeline             |
| `oc.artifacts`            | พร้อมใช้งาน   | แสดงรายการ รับ และดาวน์โหลดอาร์ติแฟกต์ transcript ของ Gateway                          |
| `oc.approvals`            | พร้อมใช้งาน   | แสดงรายการและแก้ไข exec approvals ผ่าน RPC approvals ของ Gateway                  |
| `oc.environments`         | บางส่วน | แสดงรายการตัวเลือก environment ของ Gateway-local และ node; ยังไม่ได้ต่อ create/delete |
| `oc.rawEvents()`          | พร้อมใช้งาน   | เปิดเผยเหตุการณ์ Gateway แบบ raw สำหรับผู้บริโภคขั้นสูง                                |
| `normalizeGatewayEvent()` | พร้อมใช้งาน   | แปลงเหตุการณ์ Gateway แบบ raw ให้เป็นรูปทรงเหตุการณ์ SDK ที่เสถียร                      |

SDK ยัง export ประเภทหลักที่ใช้โดยพื้นผิวเหล่านั้น:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` และประเภทผลลัพธ์ที่เกี่ยวข้อง

## เชื่อมต่อกับ Gateway

สร้างไคลเอนต์ด้วย URL ของ Gateway แบบชัดเจน หรือฉีด transport แบบกำหนดเองสำหรับ
การทดสอบและ runtimes ของแอปแบบฝัง

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
`gateway: "auto"` ได้รับการยอมรับโดย constructor แต่การค้นพบ Gateway
อัตโนมัติยังไม่ใช่ฟีเจอร์ SDK แยกต่างหาก; ให้ส่ง `url` เมื่อแอปยังไม่รู้วิธี
ค้นหา Gateway อยู่แล้ว

สำหรับการทดสอบ ให้ส่ง object ที่ implement `OpenClawTransport`:

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

refs ของโมเดลที่ระบุ provider เช่น `openai/gpt-5.5` จะถูกแยกเป็น overrides ของ Gateway
`provider` และ `model` `timeoutMs` ยังคงเป็นมิลลิวินาทีใน SDK และ
ถูกแปลงเป็นวินาที timeout ของ Gateway สำหรับ RPC `agent`

`run.wait()` ใช้ RPC `agent.wait` ของ Gateway กำหนดเวลารอที่หมดอายุ
ขณะที่การรันยัง active จะส่งคืน `status: "accepted"` แทนการแสร้งว่า
ตัวการรันเองหมดเวลา Runtime timeouts, การรันที่ถูก abort และการรันที่ถูกยกเลิกจะถูก
ทำให้เป็นมาตรฐานเป็น `timed_out` หรือ `cancelled`

## สร้างและนำเซสชันกลับมาใช้ใหม่

ใช้เซสชันเมื่อแอปต้องการสถานะ transcript ที่คงทน

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

## สตรีมเหตุการณ์

SDK ทำให้เหตุการณ์ Gateway แบบ raw อยู่ใน envelope `OpenClawEvent` ที่เสถียร:

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

ประเภทเหตุการณ์ทั่วไปประกอบด้วย:

| ประเภทเหตุการณ์            | เหตุการณ์ Gateway ต้นทาง                        |
| --------------------- | ------------------------------------------- |
| `run.started`         | การเริ่ม lifecycle ของ `agent`                     |
| `run.completed`       | การสิ้นสุด lifecycle ของ `agent`                       |
| `run.failed`          | ข้อผิดพลาด lifecycle ของ `agent`                     |
| `run.cancelled`       | การสิ้นสุด lifecycle ที่ถูก abort/ยกเลิก             |
| `run.timed_out`       | การสิ้นสุด lifecycle เพราะ timeout                       |
| `assistant.delta`     | Delta การสตรีมของ Assistant                   |
| `assistant.message`   | ข้อความของ Assistant                           |
| `thinking.delta`      | สตรีมความคิดหรือแผน                     |
| `tool.call.started`   | การเริ่มเครื่องมือ/item/command                     |
| `tool.call.delta`     | การอัปเดตเครื่องมือ/item/command                    |
| `tool.call.completed` | การเสร็จสิ้นเครื่องมือ/item/command                |
| `tool.call.failed`    | ความล้มเหลวหรือสถานะถูกบล็อกของเครื่องมือ/item/command |
| `approval.requested`  | คำขออนุมัติ exec หรือ plugin             |
| `approval.resolved`   | ผลการอนุมัติ exec หรือ plugin          |
| `session.created`     | การสร้าง `sessions.changed`                   |
| `session.updated`     | การอัปเดต `sessions.changed`                   |
| `session.compacted`   | Compaction ของ `sessions.changed`               |
| `task.updated`        | เหตุการณ์อัปเดตงาน                          |
| `artifact.updated`    | เหตุการณ์สตรีม patch                         |
| `raw`                 | เหตุการณ์ใด ๆ ที่ยังไม่มี mapping SDK ที่เสถียร  |

`Run.events()` กรองเหตุการณ์ให้เหลือ run id เดียว และ replay เหตุการณ์ที่เห็นแล้วสำหรับ
การรันที่เร็ว นั่นหมายความว่า flow ที่บันทึกไว้ปลอดภัย:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

สำหรับสตรีมทั้งแอป ให้ใช้ `oc.events()` สำหรับเฟรม Gateway แบบ raw ให้ใช้
`oc.rawEvents()`

## โมเดล เครื่องมือ อาร์ติแฟกต์ และ approvals

ตัวช่วยโมเดล map ไปยังเมธอด Gateway ปัจจุบัน:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

ตัวช่วยเครื่องมือเปิดเผย catalog ของ Gateway, effective tool view และการเรียกใช้
เครื่องมือ Gateway โดยตรง `oc.tools.invoke()` ส่งคืน envelope แบบ typed แทน
การ throw สำหรับการปฏิเสธจาก policy หรือ approval

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

ตัวช่วยอาร์ติแฟกต์เปิดเผย projection อาร์ติแฟกต์ของ Gateway สำหรับบริบท session, run หรือ
task แต่ละ call ต้องมีขอบเขต `sessionKey`, `runId` หรือ
`taskId` ที่ชัดเจนหนึ่งค่า:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

ตัวช่วย approval ใช้ RPC exec approval:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

ตัวช่วย environment เปิดเผยการค้นหา Gateway-local และ node แบบอ่านอย่างเดียว:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## สิ่งที่ยังไม่รองรับอย่างชัดเจนในวันนี้

SDK มีชื่อสำหรับโมเดลผลิตภัณฑ์ที่เราต้องการ แต่จะไม่แสร้งอย่างเงียบ ๆ
ว่า Gateway RPCs มีอยู่ call เหล่านี้ปัจจุบัน throw ข้อผิดพลาด unsupported
อย่างชัดเจน:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

ฟิลด์ต่อการรัน `workspace`, `runtime`, `environment` และ `approvals` ถูก typed
เป็นรูปทรงในอนาคต แต่ Gateway ปัจจุบันยังไม่รองรับ overrides เหล่านั้นบน
RPC `agent` หากผู้เรียกส่งค่าเหล่านั้น SDK จะ throw ก่อนส่งการรัน
เพื่อไม่ให้งานถูก execute โดยไม่ได้ตั้งใจด้วย workspace, runtime,
environment หรือพฤติกรรม approval ตามค่าเริ่มต้น

## App SDK เทียบกับ Plugin SDK

ใช้ App SDK เมื่อโค้ดอยู่นอก OpenClaw:

- สคริปต์ Node ที่เริ่มหรือสังเกตการรันของเอเจนต์
- งาน CI ที่เรียก Gateway
- แดชบอร์ดและแผงผู้ดูแลระบบ
- ส่วนขยาย IDE
- บริดจ์ภายนอกที่ไม่จำเป็นต้องกลายเป็น channel plugins
- การทดสอบ integration ด้วย Gateway transports ปลอมหรือจริง

ใช้ Plugin SDK เมื่อโค้ดรันภายใน OpenClaw:

- provider plugins
- channel plugins
- hooks ของเครื่องมือหรือ lifecycle
- agent harness plugins
- trusted runtime helpers

โค้ด App SDK ควร import จาก `@openclaw/sdk` โค้ด Plugin ควร import จาก
subpaths `openclaw/plugin-sdk/*` ที่บันทึกไว้ อย่าผสมสัญญาทั้งสองเข้าด้วยกัน

## ที่เกี่ยวข้อง

- [การออกแบบ API ของ OpenClaw App SDK](/th/reference/openclaw-sdk-api-design)
- [อ้างอิง RPC ของ Gateway](/th/reference/rpc)
- [ลูปเอเจนต์](/th/concepts/agent-loop)
- [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)
- [เซสชัน](/th/concepts/session)
- [งานเบื้องหลัง](/th/automation/tasks)
- [เอเจนต์ ACP](/th/tools/acp-agents)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
