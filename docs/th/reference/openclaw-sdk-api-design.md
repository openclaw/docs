---
read_when:
    - คุณกำลังพัฒนา SDK สำหรับแอป OpenClaw สาธารณะที่เสนอไว้
    - คุณต้องใช้สัญญาแบบร่างสำหรับ namespace, event, result, artifact, approval หรือ security สำหรับ SDK ของแอป
    - คุณกำลังเปรียบเทียบทรัพยากรโปรโตคอล Gateway กับตัวครอบ OpenClaw App SDK ระดับสูง
sidebarTitle: App SDK API design
summary: การออกแบบอ้างอิงสำหรับ API สาธารณะของ OpenClaw App SDK, อนุกรมวิธานเหตุการณ์, อาร์ติแฟกต์, การอนุมัติ และโครงสร้างแพ็กเกจ
title: การออกแบบ API ของ SDK แอป OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:30:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

หน้านี้คือการออกแบบเอกสารอ้างอิง API แบบละเอียดสำหรับ
[OpenClaw App SDK](/th/concepts/openclaw-sdk) สาธารณะ โดยตั้งใจแยกออกจาก
[Plugin SDK](/th/plugins/sdk-overview)

<Note>
  `@openclaw/sdk` คือแพ็กเกจแอป/ไคลเอนต์ภายนอกสำหรับสื่อสารกับ
  Gateway ส่วน `openclaw/plugin-sdk/*` คือสัญญาการเขียน Plugin แบบทำงานในโปรเซส
  อย่านำเข้าเส้นทางย่อยของ Plugin SDK จากแอปที่ต้องการเพียงรันเอเจนต์
</Note>

SDK แอปสาธารณะควรสร้างเป็นสองชั้น:

1. ไคลเอนต์ Gateway ระดับต่ำที่สร้างขึ้นอัตโนมัติ
2. ตัวครอบระดับสูงที่ใช้งานสะดวก พร้อมออบเจ็กต์ `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` และ `Environment`

## การออกแบบ namespace

namespace ระดับต่ำควรตามทรัพยากรของ Gateway อย่างใกล้ชิด:

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

ตัวครอบระดับสูงควรคืนออบเจ็กต์ที่ทำให้โฟลว์ทั่วไปใช้งานได้ราบรื่น:

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

## สัญญา event

SDK สาธารณะควรเปิดเผย event ที่มีเวอร์ชัน เล่นซ้ำได้ และถูกทำให้เป็นรูปแบบมาตรฐาน

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
`events({ after: id })` และรับ event ที่พลาดไปเมื่อการเก็บรักษาอนุญาต

กลุ่ม event มาตรฐานที่แนะนำ:

| Event                 | ความหมาย                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | รับการรันแล้ว                                               |
| `run.queued`          | การรันกำลังรอ lane ของเซสชัน, runtime หรือ environment |
| `run.started`         | Runtime เริ่มดำเนินการแล้ว                                  |
| `run.completed`       | การรันเสร็จสมบูรณ์สำเร็จ                                  |
| `run.failed`          | การรันจบลงพร้อมข้อผิดพลาด                                    |
| `run.cancelled`       | การรันถูกยกเลิก                                          |
| `run.timed_out`       | การรันเกินเวลาที่กำหนด                                   |
| `assistant.delta`     | เดลตาข้อความของผู้ช่วย                                       |
| `assistant.message`   | ข้อความผู้ช่วยที่สมบูรณ์หรือข้อความแทนที่                  |
| `thinking.delta`      | เดลตาการให้เหตุผลหรือแผน เมื่อ policy อนุญาตให้เปิดเผย       |
| `tool.call.started`   | การเรียก tool เริ่มขึ้น                                            |
| `tool.call.delta`     | การเรียก tool สตรีมความคืบหน้าหรือผลลัพธ์บางส่วน              |
| `tool.call.completed` | การเรียก tool คืนค่าสำเร็จ                            |
| `tool.call.failed`    | การเรียก tool ล้มเหลว                                           |
| `approval.requested`  | การรันหรือ tool ต้องการการอนุมัติ                               |
| `approval.resolved`   | การอนุมัติได้รับอนุญาต ถูกปฏิเสธ หมดอายุ หรือถูกยกเลิก        |
| `question.requested`  | Runtime ขอข้อมูลจากผู้ใช้หรือแอปโฮสต์                |
| `question.answered`   | แอปโฮสต์ให้คำตอบแล้ว                                |
| `artifact.created`    | มี artifact ใหม่พร้อมใช้งาน                                     |
| `artifact.updated`    | artifact ที่มีอยู่เปลี่ยนแปลง                                  |
| `session.created`     | สร้างเซสชันแล้ว                                            |
| `session.updated`     | metadata ของเซสชันเปลี่ยนแปลง                                   |
| `session.compacted`   | เกิด Compaction ของเซสชัน                                |
| `task.updated`        | สถานะงานพื้นหลังเปลี่ยนแปลง                              |
| `git.branch`          | Runtime ตรวจพบหรือเปลี่ยนสถานะ branch                   |
| `git.diff`            | Runtime สร้างหรือเปลี่ยน diff                         |
| `git.pr`              | Runtime เปิด อัปเดต หรือลิงก์ pull request          |

payload แบบ runtime-native ควรเข้าถึงได้ผ่าน `raw` แต่แอปไม่ควรต้อง
แยกวิเคราะห์ `raw` สำหรับ UI ปกติ

## สัญญา result

`Run.wait()` ควรคืน envelope ของผลลัพธ์ที่เสถียร:

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

ผลลัพธ์ควรเรียบง่ายและเสถียร ค่า timestamp รักษารูปทรงของ Gateway
ดังนั้นการรันปัจจุบันที่อิง lifecycle มักรายงานเป็นตัวเลข epoch มิลลิวินาที
ขณะที่ adapter อาจยังแสดงสตริง ISO ได้ UI ที่ซับซ้อน, trace ของ tool และ
รายละเอียดแบบ runtime-native ควรอยู่ใน event และ artifact

`accepted` คือผลลัพธ์การรอที่ยังไม่สิ้นสุด: หมายความว่า deadline การรอของ Gateway
หมดลงก่อนที่การรันจะสร้างจุดจบ/error ของ lifecycle ห้ามปฏิบัติต่อค่านี้เป็น
`timed_out`; `timed_out` สงวนไว้สำหรับการรันที่เกิน timeout ของ runtime เอง

## การอนุมัติและคำถาม

การอนุมัติต้องเป็นองค์ประกอบชั้นหนึ่ง เพราะเอเจนต์เขียนโค้ดข้ามขอบเขตความปลอดภัยอยู่เสมอ

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

event การอนุมัติควรมี:

- id การอนุมัติ
- id การรันและ id เซสชัน
- ชนิดคำขอ
- สรุปการกระทำที่ขอ
- ชื่อ tool หรือการกระทำของ environment
- ระดับความเสี่ยง
- การตัดสินใจที่ใช้ได้
- วันหมดอายุ
- การตัดสินใจสามารถนำกลับมาใช้ซ้ำได้หรือไม่

คำถามแยกจากการอนุมัติ คำถามขอข้อมูลจากผู้ใช้หรือแอปโฮสต์
ส่วนการอนุมัติขอสิทธิ์ในการดำเนินการ

## โมเดล ToolSpace

แอปต้องเข้าใจพื้นผิว tool โดยไม่ต้องนำเข้า internals ของ Plugin

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK ควรเปิดเผย:

- metadata ของ tool ที่ถูกทำให้เป็นรูปแบบมาตรฐาน
- แหล่งที่มา: OpenClaw, MCP, Plugin, channel, runtime หรือ app
- สรุป schema
- policy การอนุมัติ
- ความเข้ากันได้กับ runtime
- tool ถูกซ่อน เป็น readonly สามารถเขียนได้ หรือสามารถทำงานฝั่งโฮสต์ได้หรือไม่

การเรียก tool ผ่าน SDK ควรชัดเจนและมีขอบเขต แอปส่วนใหญ่ควรรันเอเจนต์
ไม่ใช่เรียก tool ใดๆ โดยตรงตามใจ

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
- screenshot และผลลัพธ์สื่อ
- log และชุด trace
- ลิงก์ pull request
- trajectory ของ runtime
- snapshot ของ workspace ใน environment ที่จัดการ

การเข้าถึง artifact ควรรองรับการปกปิดข้อมูล การเก็บรักษา และ URL ดาวน์โหลด โดยไม่
ถือว่า artifact ทุกชิ้นเป็นไฟล์ local ปกติ

## โมเดลความปลอดภัย

SDK แอปต้องระบุอำนาจอย่างชัดเจน

scope token ที่แนะนำ:

| Scope               | อนุญาตให้                                             |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | แสดงรายการและตรวจสอบเอเจนต์                            |
| `agent.run`         | เริ่มการรัน                                         |
| `session.read`      | อ่าน metadata และข้อความของเซสชัน                 |
| `session.write`     | สร้าง ส่งไปยัง fork compact และ abort เซสชัน |
| `task.read`         | อ่านสถานะงานพื้นหลัง                         |
| `task.write`        | ยกเลิกหรือแก้ไข policy การแจ้งเตือนของงาน          |
| `approval.respond`  | อนุมัติหรือปฏิเสธคำขอ                           |
| `tools.invoke`      | เรียก tool ที่เปิดเผยโดยตรง                      |
| `artifacts.read`    | แสดงรายการและดาวน์โหลด artifact                        |
| `environment.write` | สร้างหรือทำลาย environment ที่จัดการ             |
| `admin`             | การดำเนินการด้านผู้ดูแลระบบ                          |

ค่าเริ่มต้น:

- ไม่มีการส่งต่อ secret โดยค่าเริ่มต้น
- ไม่มีการส่งผ่านตัวแปร environment แบบไม่จำกัด
- ใช้การอ้างอิง secret แทนค่า secret
- policy sandbox และ network ที่ชัดเจน
- การเก็บรักษา remote environment ที่ชัดเจน
- ต้องมีการอนุมัติสำหรับการทำงานบนโฮสต์ เว้นแต่ policy จะพิสูจน์เป็นอย่างอื่น
- event ดิบของ runtime ถูกปกปิดข้อมูลก่อนออกจาก Gateway เว้นแต่ผู้เรียกจะมี
  scope การวินิจฉัยที่เข้มกว่า

## ผู้ให้บริการ managed environment

เอเจนต์ที่จัดการควรใช้เป็นผู้ให้บริการ environment

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
โฮสต์ node ที่มีอยู่, workspace ชั่วคราว, runner แบบ CI หรือ environment
แบบ Testbox ได้ สัญญาที่สำคัญคือ:

1. เตรียม workspace
2. ผูก environment และ secret อย่างปลอดภัย
3. เริ่มการรัน
4. สตรีม event
5. รวบรวม artifact
6. ล้างข้อมูลหรือเก็บรักษาตาม policy

เมื่อสิ่งนี้เสถียรแล้ว บริการคลาวด์แบบโฮสต์สามารถใช้สัญญาผู้ให้บริการเดียวกันได้

## โครงสร้างแพ็กเกจ

แพ็กเกจที่แนะนำ:

| Package                 | วัตถุประสงค์                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK ระดับสูงสาธารณะและไคลเอนต์ Gateway ระดับต่ำที่สร้างขึ้นอัตโนมัติ |
| `@openclaw/sdk-react`   | React hooks เสริมสำหรับแดชบอร์ดและผู้สร้างแอป         |
| `@openclaw/sdk-testing` | ตัวช่วยทดสอบและเซิร์ฟเวอร์ Gateway ปลอมสำหรับการเชื่อมต่อแอป    |

repo มี `openclaw/plugin-sdk/*` สำหรับ Plugin อยู่แล้ว รักษา namespace นั้น
ให้แยกจากกันเพื่อหลีกเลี่ยงการทำให้ผู้เขียน Plugin สับสนกับนักพัฒนาแอป

## กลยุทธ์ไคลเอนต์ที่สร้างขึ้นอัตโนมัติ

ไคลเอนต์ระดับต่ำควรสร้างจาก schema โปรโตคอล Gateway ที่มีเวอร์ชัน
แล้วครอบด้วยคลาสที่เขียนด้วยมือและใช้งานสะดวก

การจัดชั้น:

1. แหล่งความจริงของสคีมา Gateway.
2. ไคลเอนต์ TypeScript ระดับต่ำที่สร้างขึ้น.
3. ตัวตรวจสอบความถูกต้องขณะรันไทม์สำหรับอินพุตภายนอกและเพย์โหลดของเหตุการณ์.
4. wrapper ระดับสูง `OpenClaw`, `Agent`, `Session`, `Run`, `Task`, และ `Artifact`.
5. ตัวอย่าง Cookbook และการทดสอบการผสานรวม.

ประโยชน์:

- มองเห็นการเบี่ยงเบนของโปรโตคอลได้
- การทดสอบสามารถเปรียบเทียบเมธอดที่สร้างขึ้นกับ export ของ Gateway ได้
- App SDK เป็นอิสระจากส่วนภายในของ Plugin SDK
- ผู้ใช้ระดับต่ำยังคงเข้าถึงโปรโตคอลได้ครบถ้วน
- ผู้ใช้ระดับสูงได้รับ API ผลิตภัณฑ์ขนาดเล็ก

## ที่เกี่ยวข้อง

- [OpenClaw App SDK](/th/concepts/openclaw-sdk)
- [ข้อมูลอ้างอิง Gateway RPC](/th/reference/rpc)
- [ลูปของเอเจนต์](/th/concepts/agent-loop)
- [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)
- [งานเบื้องหลัง](/th/automation/tasks)
- [เอเจนต์ ACP](/th/tools/acp-agents)
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)
