---
read_when:
    - คุณกำลังนำ SDK แอปสาธารณะของ OpenClaw ที่เสนอไว้ไปใช้งาน
    - คุณต้องใช้สัญญาฉบับร่างสำหรับเนมสเปซ เหตุการณ์ ผลลัพธ์ อาร์ติแฟกต์ การอนุมัติ หรือความปลอดภัยสำหรับ SDK ของแอป
    - คุณกำลังเปรียบเทียบทรัพยากรโปรโตคอล Gateway กับตัวครอบ OpenClaw App SDK ระดับสูง
sidebarTitle: App SDK API design
summary: แบบออกแบบอ้างอิงสำหรับ API สาธารณะของ OpenClaw App SDK, อนุกรมวิธานเหตุการณ์, อาร์ติแฟกต์, การอนุมัติ และโครงสร้างแพ็กเกจ
title: การออกแบบ API ของ OpenClaw App SDK
x-i18n:
    generated_at: "2026-05-10T19:56:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

หน้านี้คือการออกแบบอ้างอิง API แบบละเอียดสำหรับ
[OpenClaw App SDK](/th/concepts/openclaw-sdk) สาธารณะ โดยจงใจแยกออกจาก
[Plugin SDK](/th/plugins/sdk-overview)

<Note>
  `@openclaw/sdk` คือแพ็กเกจแอป/ไคลเอนต์ภายนอกสำหรับสื่อสารกับ
  Gateway ส่วน `openclaw/plugin-sdk/*` คือสัญญาการเขียน Plugin แบบ in-process
  ห้ามนำเข้า subpath ของ Plugin SDK จากแอปที่ต้องการเพียงแค่รันเอเจนต์
</Note>

SDK ของแอปสาธารณะควรสร้างขึ้นเป็นสองชั้น:

1. ไคลเอนต์ Gateway ระดับต่ำที่สร้างจากโค้ด
2. แรปเปอร์ระดับสูงที่ใช้งานสะดวกพร้อมออบเจ็กต์ `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` และ `Environment`

## การออกแบบเนมสเปซ

เนมสเปซระดับต่ำควรตามทรัพยากรของ Gateway อย่างใกล้ชิด:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

แรปเปอร์ระดับสูงควรคืนค่าเป็นออบเจ็กต์ที่ทำให้โฟลว์ทั่วไปใช้งานได้ราบรื่น:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## สัญญาเหตุการณ์

SDK สาธารณะควรเปิดเผยเหตุการณ์ที่มีเวอร์ชัน เล่นซ้ำได้ และทำให้เป็นมาตรฐานแล้ว

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
  raw?: unknown;
};
```

`id` คือเคอร์เซอร์สำหรับเล่นซ้ำ ผู้บริโภคควรสามารถเชื่อมต่อใหม่ด้วย
`events({ after: id })` และรับเหตุการณ์ที่พลาดไปเมื่อการเก็บรักษาอนุญาต

กลุ่มเหตุการณ์มาตรฐานที่แนะนำ:

| เหตุการณ์             | ความหมาย                                                  |
| --------------------- | --------------------------------------------------------- |
| `run.created`         | รับ Run แล้ว                                              |
| `run.queued`          | Run กำลังรอเลนเซสชัน รันไทม์ หรือสภาพแวดล้อม           |
| `run.started`         | รันไทม์เริ่มดำเนินการแล้ว                                |
| `run.completed`       | Run เสร็จสิ้นสำเร็จ                                      |
| `run.failed`          | Run จบลงด้วยข้อผิดพลาด                                   |
| `run.cancelled`       | Run ถูกยกเลิก                                             |
| `run.timed_out`       | Run เกินเวลาที่กำหนด                                     |
| `assistant.delta`     | เดลตาข้อความของผู้ช่วย                                   |
| `assistant.message`   | ข้อความผู้ช่วยที่สมบูรณ์หรือข้อความแทนที่               |
| `thinking.delta`      | เดลตาการให้เหตุผลหรือแผน เมื่อ policy อนุญาตให้เปิดเผย |
| `tool.call.started`   | เริ่มเรียกใช้เครื่องมือแล้ว                              |
| `tool.call.delta`     | การเรียกใช้เครื่องมือสตรีมความคืบหน้าหรือเอาต์พุตบางส่วน |
| `tool.call.completed` | การเรียกใช้เครื่องมือคืนค่าสำเร็จ                        |
| `tool.call.failed`    | การเรียกใช้เครื่องมือล้มเหลว                             |
| `approval.requested`  | Run หรือเครื่องมือต้องการการอนุมัติ                      |
| `approval.resolved`   | การอนุมัติได้รับอนุญาต ถูกปฏิเสธ หมดอายุ หรือถูกยกเลิก |
| `question.requested`  | รันไทม์ขอข้อมูลจากผู้ใช้หรือแอปโฮสต์                    |
| `question.answered`   | แอปโฮสต์ให้คำตอบแล้ว                                     |
| `artifact.created`    | มี artifact ใหม่พร้อมใช้งาน                              |
| `artifact.updated`    | artifact ที่มีอยู่เปลี่ยนแปลง                            |
| `session.created`     | สร้างเซสชันแล้ว                                          |
| `session.updated`     | เมตาดาต้าเซสชันเปลี่ยนแปลง                              |
| `session.compacted`   | เกิด Compaction ของเซสชัน                                |
| `task.updated`        | สถานะงานเบื้องหลังเปลี่ยนแปลง                            |
| `git.branch`          | รันไทม์ตรวจพบหรือเปลี่ยนสถานะ branch                    |
| `git.diff`            | รันไทม์สร้างหรือเปลี่ยน diff                             |
| `git.pr`              | รันไทม์เปิด อัปเดต หรือลิงก์ pull request                |

เพย์โหลดดั้งเดิมของรันไทม์ควรพร้อมใช้งานผ่าน `raw` แต่แอปไม่ควร
ต้องแยกวิเคราะห์ `raw` สำหรับ UI ปกติ

## สัญญาผลลัพธ์

`Run.wait()` ควรคืน envelope ผลลัพธ์ที่เสถียร:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

ผลลัพธ์ควรเรียบง่ายและเสถียร ค่าประทับเวลาจะคงรูปแบบของ Gateway
ดังนั้น Run ปัจจุบันที่อิง lifecycle มักรายงานเป็นตัวเลข epoch millisecond
ขณะที่ adapter อาจยังแสดงสตริง ISO ได้ UI ที่มีรายละเอียด ร่องรอยเครื่องมือ และ
รายละเอียดดั้งเดิมของรันไทม์ควรอยู่ในเหตุการณ์และ artifact

`accepted` คือผลลัพธ์การรอที่ยังไม่สิ้นสุด: หมายความว่าเส้นตายการรอของ Gateway
หมดอายุก่อนที่ Run จะสร้างจุดสิ้นสุด/error ของ lifecycle ห้ามถือว่าเป็น
`timed_out`; `timed_out` สงวนไว้สำหรับ Run ที่เกิน timeout ของรันไทม์ตัวเอง

## การอนุมัติและคำถาม

การอนุมัติต้องเป็นแนวคิดหลัก เพราะเอเจนต์เขียนโค้ดมักข้ามขอบเขตความปลอดภัยอยู่เสมอ

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

เหตุการณ์การอนุมัติควรมี:

- id การอนุมัติ
- id ของ Run และ id ของเซสชัน
- ชนิดคำขอ
- สรุปการกระทำที่ขอ
- ชื่อเครื่องมือหรือการกระทำของสภาพแวดล้อม
- ระดับความเสี่ยง
- การตัดสินใจที่ใช้ได้
- เวลาหมดอายุ
- ระบุว่าการตัดสินใจนั้นนำกลับมาใช้ซ้ำได้หรือไม่

คำถามแยกจากการอนุมัติ คำถามคือการขอข้อมูลจากผู้ใช้หรือแอปโฮสต์
ส่วนการอนุมัติคือการขออนุญาตดำเนินการบางอย่าง

## โมเดล ToolSpace

แอปต้องเข้าใจพื้นผิวเครื่องมือโดยไม่ต้องนำเข้าภายในของ Plugin

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK ควรเปิดเผย:

- เมตาดาต้าเครื่องมือที่ทำให้เป็นมาตรฐานแล้ว
- แหล่งที่มา: OpenClaw, MCP, Plugin, channel, runtime หรือ app
- สรุป schema
- policy การอนุมัติ
- ความเข้ากันได้ของรันไทม์
- ระบุว่าเครื่องมือถูกซ่อน เป็น readonly เขียนได้ หรือโฮสต์ได้หรือไม่

การเรียกใช้เครื่องมือผ่าน SDK ควรชัดเจนและมีขอบเขต แอปส่วนใหญ่ควร
รันเอเจนต์ ไม่ใช่เรียกใช้เครื่องมือใดก็ได้โดยตรง

## โมเดล Artifact

Artifact ควรครอบคลุมมากกว่าไฟล์

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

ตัวอย่างทั่วไป:

- การแก้ไขไฟล์และไฟล์ที่สร้างขึ้น
- ชุด patch
- diff ของ VCS
- screenshot และเอาต์พุตสื่อ
- log และชุด trace
- ลิงก์ pull request
- trajectory ของรันไทม์
- snapshot workspace ของสภาพแวดล้อมที่จัดการ

การเข้าถึง artifact ควรรองรับการปกปิดข้อมูล การเก็บรักษา และ URL ดาวน์โหลด โดยไม่
สมมติว่า artifact ทุกชิ้นเป็นไฟล์โลคัลปกติ

## โมเดลความปลอดภัย

SDK ของแอปต้องชัดเจนเรื่องอำนาจ

scope ของ token ที่แนะนำ:

| Scope               | อนุญาตให้                                            |
| ------------------- | ---------------------------------------------------- |
| `agent.read`        | แสดงรายการและตรวจสอบเอเจนต์                         |
| `agent.run`         | เริ่ม Run                                            |
| `session.read`      | อ่านเมตาดาต้าและข้อความของเซสชัน                    |
| `session.write`     | สร้าง ส่งไปยัง fork compact และ abort เซสชัน        |
| `task.read`         | อ่านสถานะงานเบื้องหลัง                              |
| `task.write`        | ยกเลิกหรือแก้ไข policy การแจ้งเตือนของงาน           |
| `approval.respond`  | อนุมัติหรือปฏิเสธคำขอ                               |
| `tools.invoke`      | เรียกใช้เครื่องมือที่เปิดเผยโดยตรง                   |
| `artifacts.read`    | แสดงรายการและดาวน์โหลด artifact                     |
| `environment.write` | สร้างหรือทำลายสภาพแวดล้อมที่จัดการ                  |
| `admin`             | การดำเนินการด้านผู้ดูแลระบบ                         |

ค่าเริ่มต้น:

- ไม่ส่งต่อ secret โดยค่าเริ่มต้น
- ไม่มีการส่งผ่านตัวแปรสภาพแวดล้อมแบบไม่จำกัด
- ใช้การอ้างอิง secret แทนค่า secret
- policy ของ sandbox และเครือข่ายที่ชัดเจน
- การเก็บรักษาสภาพแวดล้อมระยะไกลที่ชัดเจน
- ต้องมีการอนุมัติสำหรับการดำเนินการบนโฮสต์ เว้นแต่ policy จะพิสูจน์เป็นอย่างอื่น
- เหตุการณ์รันไทม์ดิบถูกปกปิดข้อมูลก่อนออกจาก Gateway เว้นแต่ผู้เรียกจะมี
  scope การวินิจฉัยที่เข้มกว่า

## ผู้ให้บริการสภาพแวดล้อมที่จัดการ

เอเจนต์ที่จัดการควรถูกนำไปใช้เป็นผู้ให้บริการสภาพแวดล้อม

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

การใช้งานครั้งแรกไม่จำเป็นต้องเป็น SaaS ที่โฮสต์ไว้ อาจกำหนดเป้าหมายไปที่
โฮสต์ Node ที่มีอยู่, workspace ชั่วคราว, runner แบบ CI หรือสภาพแวดล้อม
แบบ Testbox ก็ได้ สัญญาที่สำคัญคือ:

1. เตรียม workspace
2. ผูกสภาพแวดล้อมและ secret ที่ปลอดภัย
3. เริ่ม Run
4. สตรีมเหตุการณ์
5. รวบรวม artifact
6. ล้างข้อมูลหรือเก็บรักษาตาม policy

เมื่อสิ่งนี้เสถียรแล้ว บริการคลาวด์ที่โฮสต์ไว้ก็สามารถนำสัญญาผู้ให้บริการเดียวกันไปใช้ได้

## โครงสร้างแพ็กเกจ

แพ็กเกจที่แนะนำ:

| แพ็กเกจ                | วัตถุประสงค์                                                  |
| ---------------------- | -------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK ระดับสูงสาธารณะและไคลเอนต์ Gateway ระดับต่ำที่สร้างจากโค้ด |
| `@openclaw/sdk-react`   | React hooks ทางเลือกสำหรับแดชบอร์ดและผู้สร้างแอป              |
| `@openclaw/sdk-testing` | ตัวช่วยทดสอบและเซิร์ฟเวอร์ Gateway ปลอมสำหรับการผสานรวมแอป    |

รีโปมี `openclaw/plugin-sdk/*` สำหรับ Plugin อยู่แล้ว ให้แยกเนมสเปซนั้นไว้
เพื่อหลีกเลี่ยงความสับสนระหว่างผู้เขียน Plugin กับนักพัฒนาแอป

## กลยุทธ์ไคลเอนต์ที่สร้างจากโค้ด

ไคลเอนต์ระดับต่ำควรสร้างจาก schema โปรโตคอล Gateway ที่มีเวอร์ชัน
แล้วห่อด้วยคลาสที่เขียนเองเพื่อให้ใช้งานสะดวก

การแบ่งชั้น:

1. แหล่งความจริงของสคีมา Gateway
2. ไคลเอนต์ TypeScript ระดับต่ำที่สร้างขึ้น
3. ตัวตรวจสอบความถูกต้องขณะรันไทม์สำหรับอินพุตภายนอกและเพย์โหลดเหตุการณ์
4. ตัวห่อหุ้มระดับสูง `OpenClaw`, `Agent`, `Session`, `Run`, `Task` และ `Artifact`
5. ตัวอย่าง cookbook และการทดสอบการเชื่อมต่อ

ประโยชน์:

- เห็นการคลาดเคลื่อนของโปรโตคอลได้ชัดเจน
- การทดสอบสามารถเปรียบเทียบเมธอดที่สร้างขึ้นกับเอ็กซ์พอร์ตของ Gateway ได้
- App SDK ยังคงเป็นอิสระจากส่วนภายในของ Plugin SDK
- ผู้ใช้งานระดับต่ำยังคงเข้าถึงโปรโตคอลได้เต็มรูปแบบ
- ผู้ใช้งานระดับสูงได้รับ API ของผลิตภัณฑ์ขนาดเล็ก

## ที่เกี่ยวข้อง

- [OpenClaw App SDK](/th/concepts/openclaw-sdk)
- [ข้อมูลอ้างอิง RPC ของ Gateway](/th/reference/rpc)
- [ลูปของเอเจนต์](/th/concepts/agent-loop)
- [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)
- [งานเบื้องหลัง](/th/automation/tasks)
- [เอเจนต์ ACP](/th/tools/acp-agents)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
