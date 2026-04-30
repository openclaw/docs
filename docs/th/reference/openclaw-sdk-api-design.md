---
read_when:
    - คุณกำลังนำ SDK สำหรับแอป OpenClaw แบบสาธารณะที่เสนอไว้ไปใช้งาน
    - คุณต้องใช้สัญญาแบบร่างสำหรับเนมสเปซ เหตุการณ์ ผลลัพธ์ อาร์ติแฟกต์ การอนุมัติ หรือความปลอดภัยของ SDK ของแอป
    - คุณกำลังเปรียบเทียบทรัพยากรของโปรโตคอล Gateway กับตัวห่อหุ้มระดับสูงของ OpenClaw App SDK
sidebarTitle: App SDK API design
summary: การออกแบบอ้างอิงสำหรับ OpenClaw App SDK API สาธารณะ การจัดหมวดหมู่เหตุการณ์ อาร์ติแฟกต์ การอนุมัติ และโครงสร้างแพ็กเกจ
title: การออกแบบ API ของ SDK แอป OpenClaw
x-i18n:
    generated_at: "2026-04-30T10:15:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

หน้านี้คือการออกแบบเอกสารอ้างอิง API แบบละเอียดสำหรับ
[SDK สำหรับแอปของ OpenClaw](/th/concepts/openclaw-sdk) สาธารณะ โดยตั้งใจแยกออกจาก
[Plugin SDK](/th/plugins/sdk-overview)

<Note>
  `@openclaw/sdk` คือแพ็กเกจแอป/ไคลเอนต์ภายนอกสำหรับสื่อสารกับ
  Gateway ส่วน `openclaw/plugin-sdk/*` คือสัญญาการสร้าง Plugin ภายในโปรเซส
  อย่านำเข้าเส้นทางย่อยของ Plugin SDK จากแอปที่ต้องการเพียงเรียกใช้เอเจนต์
</Note>

SDK สำหรับแอปสาธารณะควรสร้างเป็นสองชั้น:

1. ไคลเอนต์ Gateway ระดับล่างที่สร้างขึ้นโดยอัตโนมัติ
2. แรปเปอร์ระดับสูงที่ใช้งานสะดวก พร้อมออบเจ็กต์ `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` และ `Environment`

## การออกแบบ Namespace

Namespace ระดับล่างควรตามทรัพยากรของ Gateway อย่างใกล้ชิด:

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

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

แรปเปอร์ระดับสูงควรคืนค่าออบเจ็กต์ที่ทำให้โฟลว์ทั่วไปใช้งานได้ราบรื่น:

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

SDK สาธารณะควรเปิดเผยเหตุการณ์ที่มีเวอร์ชัน เล่นซ้ำได้ และผ่านการทำให้เป็นมาตรฐานแล้ว

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

`id` คือเคอร์เซอร์สำหรับเล่นซ้ำ ผู้ใช้ควรเชื่อมต่อใหม่ได้ด้วย
`events({ after: id })` และได้รับเหตุการณ์ที่พลาดไปเมื่อการเก็บรักษาอนุญาต

กลุ่มเหตุการณ์ที่ทำให้เป็นมาตรฐานที่แนะนำ:

| เหตุการณ์             | ความหมาย                                                   |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | ยอมรับ Run แล้ว                                            |
| `run.queued`          | Run กำลังรอเลนของเซสชัน รันไทม์ หรือสภาพแวดล้อม          |
| `run.started`         | รันไทม์เริ่มการดำเนินการแล้ว                               |
| `run.completed`       | Run เสร็จสิ้นสำเร็จ                                        |
| `run.failed`          | Run จบลงพร้อมข้อผิดพลาด                                    |
| `run.cancelled`       | Run ถูกยกเลิก                                               |
| `run.timed_out`       | Run เกินเวลาที่กำหนด                                       |
| `assistant.delta`     | ส่วนต่างข้อความของผู้ช่วย                                  |
| `assistant.message`   | ข้อความผู้ช่วยที่สมบูรณ์หรือข้อความแทนที่                 |
| `thinking.delta`      | ส่วนต่างการให้เหตุผลหรือแผน เมื่อ policy อนุญาตให้เปิดเผย |
| `tool.call.started`   | การเรียกเครื่องมือเริ่มต้นแล้ว                             |
| `tool.call.delta`     | การเรียกเครื่องมือสตรีมความคืบหน้าหรือเอาต์พุตบางส่วน     |
| `tool.call.completed` | การเรียกเครื่องมือคืนค่าสำเร็จ                             |
| `tool.call.failed`    | การเรียกเครื่องมือล้มเหลว                                  |
| `approval.requested`  | Run หรือเครื่องมือต้องการการอนุมัติ                        |
| `approval.resolved`   | การอนุมัติได้รับการอนุญาต ปฏิเสธ หมดอายุ หรือถูกยกเลิก    |
| `question.requested`  | รันไทม์ถามผู้ใช้หรือแอปโฮสต์เพื่อขอข้อมูล                 |
| `question.answered`   | แอปโฮสต์ให้คำตอบแล้ว                                       |
| `artifact.created`    | มี artifact ใหม่พร้อมใช้งาน                                |
| `artifact.updated`    | artifact ที่มีอยู่เปลี่ยนแปลง                              |
| `session.created`     | สร้างเซสชันแล้ว                                            |
| `session.updated`     | metadata ของเซสชันเปลี่ยนแปลง                              |
| `session.compacted`   | เกิด Compaction ของเซสชัน                                  |
| `task.updated`        | สถานะของงานเบื้องหลังเปลี่ยนแปลง                           |
| `git.branch`          | รันไทม์สังเกตเห็นหรือเปลี่ยนสถานะ branch                   |
| `git.diff`            | รันไทม์สร้างหรือเปลี่ยน diff                               |
| `git.pr`              | รันไทม์เปิด อัปเดต หรือเชื่อมโยง pull request              |

เพย์โหลดแบบเนทีฟของรันไทม์ควรพร้อมใช้งานผ่าน `raw` แต่แอปไม่ควรต้อง
แยกวิเคราะห์ `raw` สำหรับ UI ปกติ

## สัญญาผลลัพธ์

`Run.wait()` ควรคืนค่า envelope ผลลัพธ์ที่เสถียร:

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

ผลลัพธ์ควรเรียบง่ายและเสถียร ค่า timestamp คงรูปแบบของ Gateway ไว้
ดังนั้น Run ปัจจุบันที่รองรับด้วย lifecycle มักรายงานเป็นตัวเลขมิลลิวินาทีแบบ epoch
ขณะที่ adapter อาจยังแสดงเป็นสตริง ISO อยู่ UI ที่มีรายละเอียด, trace ของเครื่องมือ และ
รายละเอียดแบบเนทีฟของรันไทม์ควรอยู่ในเหตุการณ์และ artifact

`accepted` คือผลลัพธ์การรอที่ยังไม่สิ้นสุด: หมายความว่าเส้นตายการรอของ Gateway
หมดลงก่อนที่ Run จะสร้างจุดสิ้นสุด/ข้อผิดพลาดของ lifecycle ห้ามถือว่าเป็น
`timed_out`; `timed_out` สงวนไว้สำหรับ Run ที่เกิน timeout ของรันไทม์ของตัวเอง

## การอนุมัติและคำถาม

การอนุมัติต้องเป็นองค์ประกอบชั้นหนึ่ง เพราะเอเจนต์เขียนโค้ดข้ามขอบเขตความปลอดภัยอยู่ตลอด

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
- สรุปการดำเนินการที่ร้องขอ
- ชื่อเครื่องมือหรือการดำเนินการกับสภาพแวดล้อม
- ระดับความเสี่ยง
- การตัดสินใจที่มีให้เลือก
- วันหมดอายุ
- ระบุว่าการตัดสินใจนำกลับมาใช้ซ้ำได้หรือไม่

คำถามแยกจากการอนุมัติ คำถามขอข้อมูลจากผู้ใช้หรือแอปโฮสต์
การอนุมัติขอสิทธิ์เพื่อดำเนินการ

## โมเดล ToolSpace

แอปต้องเข้าใจพื้นผิวของเครื่องมือโดยไม่ต้องนำเข้าภายในของ Plugin

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK ควรเปิดเผย:

- metadata ของเครื่องมือที่ทำให้เป็นมาตรฐาน
- แหล่งที่มา: OpenClaw, MCP, plugin, channel, runtime หรือ app
- สรุป schema
- policy การอนุมัติ
- ความเข้ากันได้กับรันไทม์
- เครื่องมือถูกซ่อน เป็น readonly เขียนได้ หรือทำงานในฐานะโฮสต์ได้หรือไม่

การเรียกเครื่องมือผ่าน SDK ควรชัดเจนและจำกัดขอบเขต แอปส่วนใหญ่ควร
เรียกใช้เอเจนต์ ไม่ใช่เรียกเครื่องมือใดก็ได้โดยตรง

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
- snapshot พื้นที่ทำงานของสภาพแวดล้อมที่จัดการ

การเข้าถึง artifact ควรรองรับการปกปิดข้อมูล การเก็บรักษา และ URL ดาวน์โหลด โดยไม่
สมมติว่า artifact ทุกอย่างเป็นไฟล์ local ปกติ

## โมเดลความปลอดภัย

SDK แอปต้องชัดเจนเรื่องอำนาจ

ขอบเขต token ที่แนะนำ:

| ขอบเขต             | อนุญาตให้ทำอะไร                                      |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | แสดงรายการและตรวจสอบเอเจนต์                         |
| `agent.run`         | เริ่ม Run                                            |
| `session.read`      | อ่าน metadata และข้อความของเซสชัน                   |
| `session.write`     | สร้าง ส่งไปยัง fork, compact และ abort เซสชัน        |
| `task.read`         | อ่านสถานะงานเบื้องหลัง                              |
| `task.write`        | ยกเลิกหรือแก้ไข policy การแจ้งเตือนของงาน           |
| `approval.respond`  | อนุมัติหรือปฏิเสธคำขอ                               |
| `tools.invoke`      | เรียกเครื่องมือที่เปิดเผยโดยตรง                     |
| `artifacts.read`    | แสดงรายการและดาวน์โหลด artifact                     |
| `environment.write` | สร้างหรือทำลายสภาพแวดล้อมที่จัดการ                  |
| `admin`             | การดำเนินการด้านผู้ดูแลระบบ                         |

ค่าเริ่มต้น:

- ไม่มีการส่งต่อ secret โดยค่าเริ่มต้น
- ไม่มีการส่งผ่านตัวแปรสภาพแวดล้อมแบบไม่จำกัด
- ใช้การอ้างอิง secret แทนค่า secret
- policy ของ sandbox และเครือข่ายที่ชัดเจน
- การเก็บรักษาสภาพแวดล้อมระยะไกลที่ชัดเจน
- การอนุมัติสำหรับการดำเนินการบนโฮสต์ เว้นแต่ policy จะพิสูจน์เป็นอย่างอื่น
- เหตุการณ์รันไทม์ดิบถูกปกปิดข้อมูลก่อนออกจาก Gateway เว้นแต่ผู้เรียกจะมี
  ขอบเขตการวินิจฉัยที่เข้มกว่า

## ผู้ให้บริการสภาพแวดล้อมที่จัดการ

เอเจนต์ที่จัดการควรนำไปใช้งานเป็นผู้ให้บริการสภาพแวดล้อม

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

การใช้งานครั้งแรกไม่จำเป็นต้องเป็น SaaS แบบโฮสต์ สามารถกำหนดเป้าหมายไปยัง
โฮสต์ Node ที่มีอยู่ พื้นที่ทำงานชั่วคราว รันเนอร์สไตล์ CI หรือ
สภาพแวดล้อมสไตล์ Testbox ได้ สัญญาสำคัญคือ:

1. เตรียมพื้นที่ทำงาน
2. ผูกสภาพแวดล้อมและ secret ที่ปลอดภัย
3. เริ่ม Run
4. สตรีมเหตุการณ์
5. รวบรวม artifact
6. ล้างข้อมูลหรือเก็บรักษาตาม policy

เมื่อสิ่งนี้เสถียรแล้ว บริการคลาวด์แบบโฮสต์สามารถใช้สัญญาผู้ให้บริการเดียวกันได้

## โครงสร้างแพ็กเกจ

แพ็กเกจที่แนะนำ:

| แพ็กเกจ                | วัตถุประสงค์                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK ระดับสูงสาธารณะและไคลเอนต์ Gateway ระดับล่างที่สร้างขึ้น |
| `@openclaw/sdk-react`   | hook ของ React แบบเลือกใช้สำหรับแดชบอร์ดและผู้สร้างแอป        |
| `@openclaw/sdk-testing` | ตัวช่วยทดสอบและเซิร์ฟเวอร์ Gateway ปลอมสำหรับการผสานรวมแอป   |

repo มี `openclaw/plugin-sdk/*` สำหรับ plugins อยู่แล้ว ให้แยก namespace นั้นไว้
เพื่อหลีกเลี่ยงความสับสนระหว่างผู้เขียน plugin กับนักพัฒนาแอป

## กลยุทธ์ไคลเอนต์ที่สร้างขึ้น

ไคลเอนต์ระดับล่างควรถูกสร้างจากสคีมาโปรโตคอล Gateway ที่มีการกำหนดเวอร์ชัน แล้วจึงห่อหุ้มด้วยคลาสที่เขียนเองเพื่อให้ใช้งานได้สะดวก

การแบ่งชั้น:

1. สคีมา Gateway เป็นแหล่งความจริง
2. ไคลเอนต์ TypeScript ระดับล่างที่สร้างขึ้น
3. ตัวตรวจสอบความถูกต้องขณะรันไทม์สำหรับอินพุตภายนอกและเพย์โหลดเหตุการณ์
4. ตัวห่อหุ้มระดับสูง `OpenClaw`, `Agent`, `Session`, `Run`, `Task` และ `Artifact`
5. ตัวอย่าง cookbook และการทดสอบการผสานรวม

ประโยชน์:

- เห็นความคลาดเคลื่อนของโปรโตคอลได้ชัดเจน
- การทดสอบสามารถเปรียบเทียบเมธอดที่สร้างขึ้นกับ export ของ Gateway ได้
- App SDK ยังคงเป็นอิสระจากส่วนภายในของ Plugin SDK
- ผู้ใช้ระดับล่างยังคงเข้าถึงโปรโตคอลได้ครบถ้วน
- ผู้ใช้ระดับสูงได้รับ API ผลิตภัณฑ์ขนาดเล็ก

## เอกสารที่เกี่ยวข้อง

- [OpenClaw App SDK](/th/concepts/openclaw-sdk)
- [เอกสารอ้างอิง Gateway RPC](/th/reference/rpc)
- [ลูปของ Agent](/th/concepts/agent-loop)
- [รันไทม์ของ Agent](/th/concepts/agent-runtimes)
- [งานเบื้องหลัง](/th/automation/tasks)
- [Agent ของ ACP](/th/tools/acp-agents)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
