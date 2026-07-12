---
read_when:
    - การกำหนดค่านโยบาย `tools.*` รายการที่อนุญาต หรือฟีเจอร์ทดลอง
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือการแทนที่ URL ฐาน
    - การตั้งค่าปลายทางแบบโฮสต์เองที่เข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่าเครื่องมือ (นโยบาย ตัวเลือกเปิด-ปิดฟีเจอร์ทดลอง เครื่องมือที่ทำงานผ่านผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/URL ฐานแบบกำหนดเอง
title: การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-07-12T16:08:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

คีย์การกำหนดค่า `tools.*` และการตั้งค่าผู้ให้บริการแบบกำหนดเอง / URL ฐาน สำหรับเอเจนต์ ช่องทาง และคีย์การกำหนดค่าระดับบนสุดอื่นๆ โปรดดู[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` กำหนดรายการอนุญาตพื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
กระบวนการเริ่มต้นใช้งานภายในเครื่องจะกำหนดค่าเริ่มต้นให้การกำหนดค่าภายในเครื่องใหม่เป็น `tools.profile: "coding"` เมื่อยังไม่ได้ตั้งค่า (โปรไฟล์ที่ระบุไว้อย่างชัดเจนอยู่แล้วจะยังคงเดิม)
</Note>

| โปรไฟล์     | ประกอบด้วย                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | เฉพาะ `session_status`                                                                                                                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | ไม่มีข้อจำกัด (เหมือนกับไม่ได้ตั้งค่า)                                                                                                                                                                                               |

`coding` และ `messaging` จะอนุญาต `bundle-mcp` (เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้) โดยปริยายด้วย

### กลุ่มเครื่องมือ

| กลุ่ม              | เครื่องมือ                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ยอมรับเป็นนามแฝงของ `exec`)                                                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | เครื่องมือในตัวทั้งหมดข้างต้น ยกเว้น `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (ไม่รวมเครื่องมือของ Plugin)                                 |
| `group:plugins`    | เครื่องมือที่ Plugin ซึ่งโหลดแล้วเป็นเจ้าของ รวมถึงเซิร์ฟเวอร์ MCP ที่กำหนดค่าและเปิดให้ใช้ผ่าน `bundle-mcp`                                                          |

`spawn_task` ช่วยให้เอเจนต์เขียนโค้ดเสนอภารกิจติดตามผลที่ต้องยืนยันโดยไม่เริ่มทำทันที Control UI จะแสดงชื่อและสรุปเป็นชิปที่ดำเนินการได้ ส่วน TUI ที่ใช้ Gateway จะแสดงพรอมต์แบบโต้ตอบที่เทียบเท่ากัน การยอมรับจากช่องทางใดช่องทางหนึ่งจะสร้างเซสชัน managed-worktree ใหม่ และส่งพรอมต์ฉบับเต็มไปยังเซสชันนั้น ขณะที่รอบการทำงานปัจจุบันยังดำเนินต่อไป `dismiss_task` จะถอนข้อเสนอที่ยังรอดำเนินการโดยใช้ `task_id` ชั่วคราวที่ส่งคืนจาก `spawn_task`

เครื่องมือเหล่านี้จะมีให้ใช้เฉพาะเมื่อพื้นผิวของผู้ควบคุมที่เริ่มต้นสามารถรับและดำเนินการกับเหตุการณ์ข้อเสนอภารกิจของ Gateway ได้ เซสชันช่องทางและเซสชัน TUI ภายในเครื่อง/แบบฝังตัวจะไม่ได้รับเหตุการณ์เหล่านี้ การขนส่งช่องทางจำเป็นต้องมีการดำเนินการภารกิจแบบมีชนิดที่พกพาได้ ก่อนที่จะเปิดใช้โฟลว์นี้ได้อย่างปลอดภัย ข้อเสนอมีขอบเขตเฉพาะภายในโพรเซสและจะหายไปเมื่อ Gateway เริ่มทำงานใหม่ เครื่องมือทั้งสองยังคงอยู่ในโปรไฟล์ `coding` และ `group:sessions` ดังนั้นนโยบาย `tools.allow` และ `tools.deny` ปกติจะกำหนดค่าเครื่องมือเหล่านี้โดยอัตโนมัติเมื่อพื้นผิวรองรับ

### เครื่องมือ MCP และ Plugin ภายในนโยบายเครื่องมือของแซนด์บ็อกซ์

เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้จะเปิดให้ใช้เป็นเครื่องมือที่ Plugin เป็นเจ้าของภายใต้รหัส Plugin `bundle-mcp` โปรไฟล์เครื่องมือปกติสามารถอนุญาตเครื่องมือเหล่านี้ได้ แต่ `tools.sandbox.tools` เป็นด่านเพิ่มเติมสำหรับเซสชันที่ทำงานในแซนด์บ็อกซ์ หากโหมดแซนด์บ็อกซ์เป็น `"all"` หรือ `"non-main"` ให้เพิ่มหนึ่งในรายการต่อไปนี้ลงในรายการอนุญาตเครื่องมือของแซนด์บ็อกซ์ เมื่อต้องการให้เครื่องมือ MCP/Plugin มองเห็นได้:

- `bundle-mcp` สำหรับเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการจาก `mcp.servers`
- รหัส Plugin สำหรับ Plugin แบบเนทีฟที่ระบุ
- `group:plugins` สำหรับเครื่องมือทั้งหมดที่ Plugin ซึ่งโหลดแล้วเป็นเจ้าของ
- ชื่อเครื่องมือเซิร์ฟเวอร์ MCP ที่ตรงกันทุกประการ หรือโกลบของเซิร์ฟเวอร์ เช่น `outlook__send_mail` หรือ `outlook__*` เมื่อต้องการเพียงเซิร์ฟเวอร์เดียว

โกลบของเซิร์ฟเวอร์ใช้คำนำหน้าเซิร์ฟเวอร์ MCP ที่ปลอดภัยสำหรับผู้ให้บริการ ซึ่งไม่จำเป็นต้องตรงกับคีย์ดิบ `mcp.servers` อักขระที่ไม่ใช่ `[A-Za-z0-9_-]` จะเปลี่ยนเป็น `-` ชื่อที่ไม่ได้ขึ้นต้นด้วยตัวอักษรจะได้รับคำนำหน้า `mcp-` และคำนำหน้าที่ยาวหรือซ้ำกันอาจถูกตัดทอนหรือเติมคำต่อท้าย ตัวอย่างเช่น `mcp.servers["Outlook Graph"]` ใช้โกลบลักษณะ `outlook-graph__*`

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

หากไม่มีรายการในชั้นแซนด์บ็อกซ์ดังกล่าว เซิร์ฟเวอร์ MCP ยังคงโหลดสำเร็จได้ แต่เครื่องมือของเซิร์ฟเวอร์จะถูกกรองออกก่อนคำขอไปยังผู้ให้บริการ ใช้ `openclaw doctor` เพื่อตรวจจับรูปแบบนี้สำหรับเซิร์ฟเวอร์ที่ OpenClaw จัดการใน `mcp.servers` เซิร์ฟเวอร์ MCP ที่โหลดจากแมนิเฟสต์ Plugin ที่รวมมาให้หรือ `.mcp.json` ของ Claude ใช้ด่านแซนด์บ็อกซ์เดียวกัน แต่การวินิจฉัยนี้ยังไม่แจกแจงแหล่งที่มาเหล่านั้น หากเครื่องมือดังกล่าวหายไปในรอบการทำงานแบบแซนด์บ็อกซ์ ให้ใช้รายการอนุญาตชุดเดียวกัน

### `tools.codeMode`

`tools.codeMode` เปิดใช้พื้นผิวโหมดโค้ดทั่วไปของ OpenClaw เมื่อเปิดใช้
สำหรับการทำงานที่มีเครื่องมือ เครื่องมือ OpenClaw ปกติจะย้ายไปอยู่เบื้องหลังบริดจ์แค็ตตาล็อก `tools.*`
ภายในแซนด์บ็อกซ์ และเครื่องมือ MCP จะใช้งานได้ผ่านเนมสเปซ `MCP`
โดยปกติโมเดลจะเห็น `exec` และ `wait` ส่วนเครื่องมืออย่าง `computer`
ซึ่งผลลัพธ์แบบมีโครงสร้างไม่สามารถส่งผ่านบริดจ์ที่รองรับเฉพาะ JSON ได้ จะยังคงเป็นเครื่องมือโดยตรง

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

รองรับรูปแบบย่อด้วย:

```json5
{
  tools: { codeMode: true },
}
```

การประกาศ MCP จะเปิดให้ใช้ผ่านพื้นผิวไฟล์ API เสมือนแบบอ่านอย่างเดียวใน
โหมดโค้ด โค้ดผู้เยี่ยมชมสามารถเรียก `API.list("mcp")` และ
`API.read("mcp/<server>.d.ts")` เพื่อตรวจสอบซิกเนเจอร์แบบ TypeScript ก่อน
เรียก `MCP.<server>.<tool>()` โปรดดู[โหมดโค้ด](/th/reference/code-mode)สำหรับ
สัญญารันไทม์ ขีดจำกัด และขั้นตอนการแก้ไขจุดบกพร่อง

### `tools.allow` / `tools.deny`

นโยบายอนุญาต/ปฏิเสธเครื่องมือส่วนกลาง (การปฏิเสธมีผลเหนือกว่า) ไม่คำนึงถึงตัวพิมพ์เล็ก-ใหญ่และรองรับอักขระตัวแทน `*` นโยบายนี้มีผลแม้ปิดแซนด์บ็อกซ์ Docker

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` และ `apply_patch` เป็นรหัสเครื่องมือแยกกัน `allow: ["write"]` จะเปิดใช้ `apply_patch` สำหรับโมเดลที่เข้ากันได้ด้วย แต่ `deny: ["write"]` จะไม่ปฏิเสธ `apply_patch` หากต้องการป้องกันการแก้ไขไฟล์ทั้งหมด ให้ปฏิเสธ `group:fs` หรือระบุเครื่องมือที่แก้ไขไฟล์แต่ละรายการอย่างชัดเจน:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
ไม่สามารถตั้งค่า `allow` และ `alsoAllow` พร้อมกันในขอบเขตเดียวกันได้ (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) เนื่องจากการตรวจสอบความถูกต้องของการกำหนดค่าจะปฏิเสธ ให้รวมรายการใน `alsoAllow` เข้ากับ `allow` หรือลบ `allow` แล้วใช้ `profile` + `alsoAllow` แทน
</Note>

### `tools.byProvider`

จำกัดเครื่องมือเพิ่มเติมสำหรับผู้ให้บริการหรือโมเดลที่ระบุ ลำดับ: โปรไฟล์พื้นฐาน → โปรไฟล์ผู้ให้บริการ → อนุญาต/ปฏิเสธ

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

จำกัดเครื่องมือสำหรับข้อมูลประจำตัวของผู้ร้องขอที่ระบุ นี่เป็นการป้องกันเชิงลึกเพิ่มเติมจากการควบคุมการเข้าถึงช่องทาง โดยค่าผู้ส่งต้องมาจากอะแดปเตอร์ช่องทาง ไม่ใช่ข้อความในสาร

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

คีย์ใช้คำนำหน้าที่ชัดเจน ได้แก่ `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` หรือ `"*"` รหัสช่องทางเป็นรหัสมาตรฐานของ OpenClaw โดยนามแฝง เช่น `teams` จะถูกปรับเป็น `msteams` คีย์แบบเดิมที่ไม่มีคำนำหน้าจะได้รับการยอมรับเป็น `id:` เท่านั้น ลำดับการจับคู่คือ ช่องทาง+รหัส, รหัส, e164, ชื่อผู้ใช้, ชื่อที่แสดง และอักขระตัวแทน

`agents.list[].tools.toolsBySender` ของแต่ละเอเจนต์จะเขียนทับการจับคู่ผู้ส่งส่วนกลางเมื่อจับคู่สำเร็จ แม้จะเป็นนโยบายว่าง `{}`

### `tools.elevated`

ควบคุมสิทธิ์เข้าถึง `exec` แบบยกระดับนอกแซนด์บ็อกซ์:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- การเขียนทับสำหรับแต่ละเอเจนต์ (`agents.list[].tools.elevated`) ทำได้เฉพาะการจำกัดเพิ่มเติมเท่านั้น
- `/elevated on|off|ask|full` จัดเก็บสถานะแยกตามเซสชัน ส่วนคำสั่งแบบอินไลน์มีผลกับข้อความเดียว
- `exec` แบบยกระดับจะข้ามการทำแซนด์บ็อกซ์และใช้เส้นทางออกที่กำหนดค่าไว้ (ค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อเป้าหมายการเรียกใช้คือ `node`)

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

ค่าที่แสดงเป็นค่าเริ่มต้น ยกเว้น `applyPatch.allowModels` (โดยค่าเริ่มต้นจะว่างหรือไม่ได้ตั้งค่า ซึ่งหมายความว่าโมเดลที่เข้ากันได้ทุกรุ่นสามารถใช้ `apply_patch` ได้) `approvalRunningNoticeMs` จะแสดงการแจ้งเตือนว่ากำลังทำงานเมื่อ `exec` ที่ต้องได้รับการอนุมัติทำงานเป็นเวลานาน ค่า `0` จะปิดการแจ้งเตือนนี้

### `tools.loopDetection`

การตรวจสอบความปลอดภัยของลูปเครื่องมือจะถูก **ปิดใช้งานโดยค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้งานการตรวจจับ สามารถกำหนดการตั้งค่าแบบส่วนกลางใน `tools.loopDetection` และเขียนทับสำหรับแต่ละเอเจนต์ได้ที่ `agents.list[].tools.loopDetection`

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  จำนวนสูงสุดของประวัติการเรียกเครื่องมือที่เก็บไว้สำหรับวิเคราะห์ลูป
</ParamField>
<ParamField path="warningThreshold" type="number">
  เกณฑ์ของรูปแบบการทำซ้ำที่ไม่มีความคืบหน้าสำหรับการแจ้งเตือน
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  บล็อกการเรียกชื่อเครื่องมือเดิมที่ไม่พร้อมใช้งานหรือไม่รู้จักซ้ำ เมื่อพลาดครบจำนวนครั้งนี้
</ParamField>
<ParamField path="criticalThreshold" type="number">
  เกณฑ์การทำซ้ำที่สูงขึ้นสำหรับบล็อกลูปขั้นวิกฤต
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  เกณฑ์หยุดโดยเด็ดขาดสำหรับการทำงานใด ๆ ที่ไม่มีความคืบหน้า
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  แจ้งเตือนเมื่อเรียกเครื่องมือเดิมด้วยอาร์กิวเมนต์เดิมซ้ำ
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  แจ้งเตือนหรือบล็อกเครื่องมือสำรวจสถานะที่รู้จัก (`process.poll`, `command_status` เป็นต้น)
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  แจ้งเตือนหรือบล็อกรูปแบบคู่สลับกันที่ไม่มีความคืบหน้า
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  จำนวนครั้งที่อนุญาตให้ลองหลัง Compaction อัตโนมัติซึ่งตัวป้องกันจะยังคงทำงานอยู่ โดยจะยุติหากเอเจนต์ทำซ้ำชุดเดิม (เครื่องมือ อาร์กิวเมนต์ ผลลัพธ์) ภายในช่วงดังกล่าว
</ParamField>

<Warning>
หาก `warningThreshold >= criticalThreshold` หรือ `criticalThreshold >= globalCircuitBreakerThreshold` การตรวจสอบความถูกต้องจะล้มเหลว
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

ค่าที่แสดงเป็นค่าเริ่มต้น ยกเว้น `provider` และ `userAgent` โดย `maxResponseBytes` จะถูกจำกัดให้อยู่ในช่วง 32000–10000000 และ `maxChars` จะถูกจำกัดตาม `maxCharsCap` (เพิ่ม `maxCharsCap` เพื่ออนุญาตการตอบกลับที่ใหญ่ขึ้น)

### `tools.media`

กำหนดค่าการทำความเข้าใจสื่อขาเข้า (รูปภาพ/เสียง/วิดีโอ):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (ค่าเริ่มต้น `2`), `audio.maxBytes` (ค่าเริ่มต้น 20 MB) และ `video.maxBytes` (ค่าเริ่มต้น 50 MB) แสดงด้วยค่าเริ่มต้น ส่วน `image.maxBytes` มีค่าเริ่มต้นเป็น 10 MB ระยะหมดเวลาของคำขอเริ่มต้นต่อความสามารถคือ รูปภาพ/เสียง `60` วินาที และวิดีโอ `120` วินาที

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **รายการผู้ให้บริการ** (`type: "provider"` หรือละไว้):

    - `provider`: รหัสผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` เป็นต้น)
    - `model`: ค่ารหัสโมเดลที่ใช้แทน
    - `profile` / `preferredProfile`: การเลือกโปรไฟล์จาก `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะเรียกใช้
    - `args`: อาร์กิวเมนต์ตามเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` เป็นต้น โดย `openclaw doctor --fix` จะย้ายตัวแทนค่า `{input}` ที่เลิกใช้แล้วไปเป็น `{{MediaPath}}`)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการที่ระบุหรือไม่ก็ได้ (`image`, `audio`, `video`) Plugin ของผู้ให้บริการแต่ละรายจะประกาศชุดความสามารถเริ่มต้นของตนเอง ตัวอย่างเช่น ผู้ให้บริการ `openai` ที่รวมมาให้มีค่าเริ่มต้นเป็นรูปภาพ+เสียง, `anthropic`/`minimax` เป็นรูปภาพ, `google` เป็นรูปภาพ+เสียง+วิดีโอ และ `groq` เป็นเสียง
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: ค่าที่กำหนดแทนสำหรับแต่ละรายการ
    - `tools.media.image.timeoutSeconds` และรายการ `timeoutSeconds` ของโมเดลรูปภาพที่ตรงกันจะมีผลด้วยเมื่อเอเจนต์เรียกเครื่องมือ `image` โดยตรง สำหรับการทำความเข้าใจรูปภาพ ระยะหมดเวลานี้มีผลกับตัวคำขอเอง และจะไม่ลดลงจากงานเตรียมการก่อนหน้า
    - เมื่อเกิดความล้มเหลว ระบบจะเปลี่ยนไปใช้รายการถัดไป

    การยืนยันตัวตนของผู้ให้บริการเป็นไปตามลำดับมาตรฐาน: `auth-profiles.json` → ตัวแปรสภาพแวดล้อม → `models.providers.*.apiKey`

    **ฟิลด์การทำงานเสร็จแบบอะซิงโครนัส:**

    - `asyncCompletion.directSend`: แฟล็กความเข้ากันได้ที่เลิกใช้แล้ว งานสื่อแบบอะซิงโครนัสที่เสร็จสมบูรณ์จะยังคงผ่านเซสชันของผู้ร้องขอ เพื่อให้เอเจนต์ได้รับผลลัพธ์ ตัดสินใจว่าจะบอกผู้ใช้อย่างไร และใช้เครื่องมือส่งข้อความเมื่อต้นทางกำหนดให้ต้องส่งผ่านเครื่องมือนั้น

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

ควบคุมว่าเครื่องมือเซสชัน (`sessions_list`, `sessions_history`, `sessions_send`) สามารถกำหนดเป้าหมายไปยังเซสชันใดได้บ้าง

ค่าเริ่มต้น: `tree` (เซสชันปัจจุบัน + เซสชันที่เซสชันนี้สร้างขึ้น เช่น เอเจนต์ย่อย)

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Visibility scopes">
    - `self`: เฉพาะคีย์ของเซสชันปัจจุบัน
    - `tree`: เซสชันปัจจุบัน + เซสชันที่เซสชันปัจจุบันสร้างขึ้น (เอเจนต์ย่อย)
    - `agent`: เซสชันใด ๆ ที่เป็นของรหัสเอเจนต์ปัจจุบัน (อาจรวมผู้ใช้รายอื่น หากคุณเรียกใช้เซสชันแยกตามผู้ส่งภายใต้รหัสเอเจนต์เดียวกัน)
    - `all`: เซสชันใด ๆ การกำหนดเป้าหมายข้ามเอเจนต์ยังคงต้องใช้ `tools.agentToAgent`
    - ข้อจำกัดของแซนด์บ็อกซ์: เมื่อเซสชันปัจจุบันอยู่ในแซนด์บ็อกซ์และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (ค่าเริ่มต้น) ระบบจะบังคับการมองเห็นเป็น `tree` แม้ตั้งค่า `tools.sessions.visibility="all"`
    - เมื่อไม่ใช่ `all` ผลลัพธ์ของ `sessions_list` จะมีฟิลด์ `visibility` แบบย่อ
      ซึ่งอธิบายโหมดที่มีผลจริง พร้อมคำเตือนว่าบางเซสชันนอกขอบเขตปัจจุบัน
      อาจไม่ถูกรวมไว้

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

ควบคุมการรองรับไฟล์แนบแบบอินไลน์สำหรับ `sessions_spawn`

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachment notes">
    - ไฟล์แนบต้องตั้งค่า `enabled: true`
    - ไฟล์แนบของเอเจนต์ย่อยจะถูกสร้างเป็นไฟล์จริงในพื้นที่ทำงานของเซสชันลูกที่ `.openclaw/attachments/<uuid>/` พร้อมไฟล์ `.manifest.json`
    - ไฟล์แนบ ACP รองรับเฉพาะรูปภาพและจะถูกส่งต่อแบบอินไลน์ไปยังรันไทม์ ACP หลังผ่านข้อจำกัดเดียวกันทั้งจำนวนไฟล์ จำนวนไบต์ต่อไฟล์ และจำนวนไบต์รวม
    - เนื้อหาของไฟล์แนบจะถูกปกปิดโดยอัตโนมัติในการจัดเก็บบทสนทนา
    - ข้อมูลนำเข้า Base64 จะได้รับการตรวจสอบตัวอักษรและการเติมส่วนท้ายอย่างเข้มงวด พร้อมตัวป้องกันขนาดก่อนถอดรหัส
    - สิทธิ์ของไฟล์แนบเอเจนต์ย่อยคือ `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
    - การล้างข้อมูลของเอเจนต์ย่อยเป็นไปตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ ส่วน `keep` จะเก็บไว้เฉพาะเมื่อตั้งค่า `retainOnSessionKeep: true`

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือในตัวที่อยู่ในขั้นทดลอง ค่าเริ่มต้นคือปิด เว้นแต่กฎเปิดใช้อัตโนมัติสำหรับ GPT-5 แบบเอเจนต์เคร่งครัดจะมีผล

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: เปิดใช้เครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับติดตามงานหลายขั้นตอนที่ไม่ใช่งานเล็กน้อย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedAgent.executionContract` (หรือค่าที่กำหนดแทนสำหรับแต่ละเอเจนต์) จะถูกตั้งเป็น `"strict-agentic"` สำหรับการทำงานของผู้ให้บริการ `openai` กับรหัสโมเดลตระกูล GPT-5 (ครอบคลุมการทำงานของ OpenAI Codex CLI ด้วย เนื่องจากการกำหนดเส้นทางการยืนยันตัวตนและโมเดลของ Codex อยู่ภายใต้ผู้ให้บริการ `openai`) ตั้งเป็น `true` เพื่อบังคับเปิดเครื่องมือนอกขอบเขตดังกล่าว หรือ `false` เพื่อคงสถานะปิดไว้แม้ในการทำงาน GPT-5 แบบเอเจนต์เคร่งครัด
- เมื่อเปิดใช้งาน พรอมต์ระบบจะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้เครื่องมือนี้เฉพาะกับงานที่มีสาระสำคัญ และมีขั้นตอนสถานะ `in_progress` ได้ไม่เกินหนึ่งขั้นตอน

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: โมเดลเริ่มต้นสำหรับเอเจนต์ย่อยที่สร้างขึ้น หากละไว้ เอเจนต์ย่อยจะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: รายการอนุญาตเริ่มต้นของรหัสเอเจนต์เป้าหมายที่กำหนดค่าไว้สำหรับ `sessions_spawn` เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตนเอง (`["*"]` = เป้าหมายที่กำหนดค่าไว้ใด ๆ ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน) รายการที่ล้าสมัยซึ่งการกำหนดค่าเอเจนต์ถูกลบไปแล้วจะถูก `sessions_spawn` ปฏิเสธและไม่นำมาแสดงใน `agents_list` ให้เรียกใช้ `openclaw doctor --fix` เพื่อล้างรายการเหล่านี้
- `maxConcurrent`: จำนวนการทำงานของเอเจนต์ย่อยพร้อมกันสูงสุด ค่าเริ่มต้น: `8`
- `runTimeoutSeconds`: ระยะหมดเวลา (วินาที) สำหรับ `sessions_spawn` เมื่อผู้เรียกไม่ได้ส่งค่าที่กำหนดแทนของตนเอง ค่าเริ่มต้น: `0` (ไม่มีระยะหมดเวลา) ค่า `900` ที่แสดงข้างต้นเป็นค่าที่นิยมเลือกใช้ ไม่ใช่ค่าเริ่มต้นในตัว
- `announceTimeoutMs`: ระยะหมดเวลาต่อการเรียก (มิลลิวินาที) สำหรับความพยายามส่งประกาศ `agent` ของ Gateway ค่าเริ่มต้น: `120000` การลองใหม่จากความล้มเหลวชั่วคราวอาจทำให้เวลารอประกาศรวมยาวกว่าระยะหมดเวลาที่กำหนดไว้หนึ่งรอบ
- `archiveAfterMinutes`: จำนวนนาทีหลังเซสชันเอเจนต์ย่อยเสร็จสิ้นก่อนถูกเก็บถาวรโดยอัตโนมัติ ค่าเริ่มต้น: `60`; `0` ปิดการเก็บถาวรอัตโนมัติ
- นโยบายเครื่องมือรายเอเจนต์ย่อย: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## ผู้ให้บริการและ URL ฐานแบบกำหนดเอง

Plugin ของผู้ให้บริการจะเผยแพร่แถวแค็ตตาล็อกโมเดลของตนเอง เพิ่มผู้ให้บริการแบบกำหนดเองผ่าน `models.providers` ในการกำหนดค่า หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

การกำหนด `baseUrl` ของผู้ให้บริการแบบกำหนดเองหรือภายในเครื่อง ยังเป็นการตัดสินใจด้านความเชื่อถือของเครือข่ายแบบจำกัดขอบเขตสำหรับคำขอ HTTP ของโมเดลด้วย โดย OpenClaw จะอนุญาตต้นทาง `scheme://host:port` ที่ระบุนั้นผ่านเส้นทางการดึงข้อมูลที่มีการป้องกัน โดยไม่เพิ่มตัวเลือกการกำหนดค่าแยกต่างหากหรือเชื่อถือต้นทางส่วนตัวอื่น ๆ

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ลำดับความสำคัญของการรับรองความถูกต้องและการผสาน">
    - ใช้ `authHeader: true` ร่วมกับ `headers` สำหรับความต้องการด้านการรับรองความถูกต้องแบบกำหนดเอง
    - แทนที่ไดเรกทอรีรากของการกำหนดค่าเอเจนต์ด้วย `OPENCLAW_AGENT_DIR`
    - ลำดับความสำคัญในการผสานสำหรับรหัสผู้ให้บริการที่ตรงกัน:
      - ค่า `baseUrl` ที่ไม่ว่างใน `models.json` ของเอเจนต์มีลำดับความสำคัญ
      - ค่า `apiKey` ที่ไม่ว่างของเอเจนต์มีลำดับความสำคัญเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้รับการจัดการด้วย SecretRef ในบริบทการกำหนดค่า/โปรไฟล์การรับรองความถูกต้องปัจจุบัน
      - ค่า `apiKey` ของผู้ให้บริการที่จัดการด้วย SecretRef จะได้รับการรีเฟรชจากเครื่องหมายแหล่งที่มา (`ENV_VAR_NAME` สำหรับการอ้างอิงตัวแปรสภาพแวดล้อม และ `secretref-managed` สำหรับการอ้างอิงไฟล์/การเรียกใช้) แทนการจัดเก็บข้อมูลลับที่แก้ค่าแล้วอย่างถาวร
      - ค่าส่วนหัวของผู้ให้บริการที่จัดการด้วย SecretRef จะได้รับการรีเฟรชจากเครื่องหมายแหล่งที่มา (`secretref-env:ENV_VAR_NAME` สำหรับการอ้างอิงตัวแปรสภาพแวดล้อม และ `secretref-managed` สำหรับการอ้างอิงไฟล์/การเรียกใช้)
      - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือไม่มีอยู่จะย้อนกลับไปใช้ `models.providers` ในการกำหนดค่า
      - สำหรับ `contextWindow`/`maxTokens` ของโมเดลที่ตรงกัน: ค่าการกำหนดค่าที่ระบุไว้อย่างชัดเจนมีลำดับความสำคัญเมื่อมีอยู่และถูกต้อง (เป็นจำนวนจำกัดที่มากกว่าศูนย์) มิฉะนั้นจะใช้ค่าแค็ตตาล็อกโดยนัย/ที่สร้างขึ้น
      - `contextTokens` ของโมเดลที่ตรงกันใช้กฎเดียวกัน คือค่าที่ระบุชัดเจนมีลำดับความสำคัญ มิฉะนั้นใช้ค่าโดยนัย ใช้ค่านี้เพื่อจำกัดบริบทที่มีผลโดยไม่เปลี่ยนข้อมูลเมตาดั้งเดิมของโมเดล
      - แค็ตตาล็อกของ Plugin ผู้ให้บริการจะจัดเก็บเป็นส่วนย่อยของแค็ตตาล็อกที่สร้างขึ้นและ Plugin เป็นเจ้าของ ภายใต้สถานะ Plugin ของเอเจนต์
      - ใช้ `models.mode: "replace"` เมื่อต้องการให้การกำหนดค่าเขียน `models.json` ใหม่ทั้งหมดและข้ามการผสานส่วนย่อยของแค็ตตาล็อกที่ Plugin เป็นเจ้าของ
      - การจัดเก็บเครื่องหมายยึดแหล่งที่มาเป็นหลัก: เครื่องหมายจะเขียนจากสแนปช็อตการกำหนดค่าของแหล่งที่มาที่ใช้งานอยู่ (ก่อนการแก้ค่า) ไม่ใช่จากค่าข้อมูลลับขณะรันที่แก้ค่าแล้ว

  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ของผู้ให้บริการ

<AccordionGroup>
  <Accordion title="แค็ตตาล็อกระดับบนสุด">
    - `models.mode`: ลักษณะการทำงานของแค็ตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
    - `models.providers`: แมปผู้ให้บริการแบบกำหนดเองที่ใช้รหัสผู้ให้บริการเป็นคีย์
      - การแก้ไขอย่างปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเติม `config set` จะปฏิเสธการแทนที่ที่ทำลายข้อมูล เว้นแต่คุณจะส่ง `--replace`

  </Accordion>
  <Accordion title="การเชื่อมต่อและการรับรองความถูกต้องของผู้ให้บริการ">
    - `models.providers.*.api`: อะแดปเตอร์คำขอ (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`) สำหรับแบ็กเอนด์ `/v1/chat/completions` ที่โฮสต์เอง เช่น MLX, vLLM, SGLang และเซิร์ฟเวอร์ภายในที่เข้ากันได้กับ OpenAI ส่วนใหญ่ ให้ใช้ `openai-completions` ผู้ให้บริการแบบกำหนดเองที่มี `baseUrl` แต่ไม่มี `api` จะใช้ `openai-completions` เป็นค่าเริ่มต้น ให้ตั้งค่า `openai-responses` เฉพาะเมื่อแบ็กเอนด์รองรับ `/v1/responses`
    - `models.providers.*.apiKey`: ข้อมูลประจำตัวของผู้ให้บริการ (แนะนำให้ใช้ SecretRef/การแทนค่าจากตัวแปรสภาพแวดล้อม)
    - `models.providers.*.auth`: กลยุทธ์การรับรองความถูกต้อง (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.contextWindow`: หน้าต่างบริบทดั้งเดิมเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextWindow`
    - `models.providers.*.contextTokens`: ขีดจำกัดบริบทขณะรันที่มีผลเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextTokens`
    - `models.providers.*.maxTokens`: ขีดจำกัดโทเค็นเอาต์พุตเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `maxTokens`
    - `models.providers.*.timeoutSeconds`: ระยะหมดเวลาคำขอ HTTP ของโมเดลต่อผู้ให้บริการซึ่งเป็นตัวเลือก โดยมีหน่วยเป็นวินาที ครอบคลุมการเชื่อมต่อ ส่วนหัว เนื้อหา และการจัดการยกเลิกคำขอทั้งหมด
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama ร่วมกับ `openai-completions` ให้แทรก `options.num_ctx` ลงในคำขอ (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับส่งข้อมูลประจำตัวในส่วนหัว `Authorization` เมื่อจำเป็น
    - `models.providers.*.baseUrl`: URL ฐานของ API ต้นทาง
    - `models.providers.*.headers`: ส่วนหัวแบบคงที่เพิ่มเติมสำหรับการกำหนดเส้นทางพร็อกซี/ผู้เช่า

  </Accordion>
  <Accordion title="การแทนที่การส่งคำขอ">
    `models.providers.*.request`: การแทนที่การส่งสำหรับคำขอ HTTP ระหว่างโมเดลกับผู้ให้บริการ

    - `request.headers`: ส่วนหัวเพิ่มเติม (ผสานกับค่าเริ่มต้นของผู้ให้บริการ) ค่ารองรับ SecretRef
    - `request.auth`: การแทนที่กลยุทธ์การรับรองความถูกต้อง โหมด: `"provider-default"` (ใช้การรับรองความถูกต้องในตัวของผู้ให้บริการ), `"authorization-bearer"` (ร่วมกับ `token`), `"header"` (ร่วมกับ `headerName`, `value` และ `prefix` ซึ่งเป็นตัวเลือก)
    - `request.proxy`: การแทนที่พร็อกซี HTTP โหมด: `"env-proxy"` (ใช้ตัวแปรสภาพแวดล้อม `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (ร่วมกับ `url`) ทั้งสองโหมดรองรับออบเจ็กต์ย่อย `tls` ซึ่งเป็นตัวเลือก
    - `request.tls`: การแทนที่ TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรองรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาตให้คำขอ HTTP ระหว่างโมเดลกับผู้ให้บริการผ่านตัวป้องกันการดึงข้อมูล HTTP ของผู้ให้บริการไปยังเครือข่ายส่วนตัว, CGNAT หรือช่วงที่คล้ายกันได้ URL ฐานของผู้ให้บริการแบบกำหนดเอง/ภายในเชื่อถือต้นทางที่กำหนดค่าไว้อย่างตรงกันอยู่แล้ว ยกเว้นต้นทางเมทาดาทา/ลิงก์ภายในเครื่อง ซึ่งยังคงถูกบล็อกหากไม่ได้เลือกอนุญาตอย่างชัดเจน ตั้งค่านี้เป็น `false` เพื่อยกเลิกการเชื่อถือต้นทางที่ตรงกัน WebSocket ใช้ `request` เดียวกันสำหรับส่วนหัว/TLS แต่ไม่ใช้ด่านป้องกัน SSRF สำหรับการดึงข้อมูลดังกล่าว ค่าเริ่มต้นคือ `false`

  </Accordion>
  <Accordion title="รายการแค็ตตาล็อกโมเดล">
    - `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของผู้ให้บริการที่ระบุไว้อย่างชัดเจน
    - `models.providers.*.models.*.input`: รูปแบบอินพุตของโมเดล ใช้ `["text"]` สำหรับโมเดลที่รองรับเฉพาะข้อความ และ `["text", "image"]` สำหรับโมเดลรูปภาพ/การมองเห็นโดยตรง ไฟล์แนบรูปภาพจะถูกแทรกลงในรอบการทำงานของเอเจนต์เฉพาะเมื่อโมเดลที่เลือกถูกระบุว่ารองรับรูปภาพ
    - `models.providers.*.models.*.contextWindow`: ข้อมูลเมตาหน้าต่างบริบทดั้งเดิมของโมเดล ค่านี้แทนที่ `contextWindow` ระดับผู้ให้บริการสำหรับโมเดลนั้น
    - `models.providers.*.models.*.contextTokens`: ขีดจำกัดบริบทขณะรันซึ่งเป็นตัวเลือก ค่านี้แทนที่ `contextTokens` ระดับผู้ให้บริการ ใช้เมื่อต้องการงบประมาณบริบทที่มีผลน้อยกว่า `contextWindow` ดั้งเดิมของโมเดล โดย `openclaw models list` จะแสดงทั้งสองค่าเมื่อค่าแตกต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: คำแนะนำด้านความเข้ากันได้ซึ่งเป็นตัวเลือก สำหรับ `api: "openai-completions"` ที่มี `baseUrl` ซึ่งไม่ว่างและไม่ใช่ต้นทางดั้งเดิม (โฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ขณะรัน หาก `baseUrl` ว่าง/ไม่ได้ระบุ จะคงลักษณะการทำงานเริ่มต้นของ OpenAI
    - `models.providers.*.models.*.compat.requiresStringContent`: คำแนะนำด้านความเข้ากันได้ซึ่งเป็นตัวเลือกสำหรับปลายทางแชตที่เข้ากันได้กับ OpenAI และรองรับเฉพาะสตริง เมื่อเป็น `true` OpenClaw จะแปลงอาร์เรย์ `messages[].content` ที่มีเฉพาะข้อความให้เป็นสตริงธรรมดาก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.strictMessageKeys`: คำแนะนำด้านความเข้ากันได้ซึ่งเป็นตัวเลือกสำหรับปลายทางแชตที่เข้ากันได้กับ OpenAI และตรวจสอบรูปแบบอย่างเข้มงวด เมื่อเป็น `true` OpenClaw จะตัดออบเจ็กต์ข้อความ Chat Completions ขาออกให้เหลือเพียง `role` และ `content` ก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.thinkingFormat`: คำแนะนำเพย์โหลดการคิดซึ่งเป็นตัวเลือก ใช้ `"together"` สำหรับ `reasoning.enabled` รูปแบบ Together, `"qwen"` สำหรับ `enable_thinking` ระดับบนสุด หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ในตระกูล Qwen ซึ่งรองรับอาร์กิวเมนต์คำสำคัญของเทมเพลตแชตระดับคำขอ เช่น vLLM โมเดล Qwen บน vLLM ที่กำหนดค่าแล้วจะแสดงตัวเลือก `/think` แบบสองค่า (`off`, `on`) สำหรับรูปแบบเหล่านี้
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: คำแนะนำด้านความเข้ากันได้ซึ่งเป็นตัวเลือกสำหรับแบ็กเอนด์ Chat Completions รูปแบบ DeepSeek ที่กำหนดให้ข้อความผู้ช่วยก่อนหน้าคง `reasoning_content` ไว้เมื่อเล่นซ้ำ เมื่อเป็น `true` OpenClaw จะรักษาฟิลด์ดังกล่าวไว้ในข้อความผู้ช่วยขาออก ใช้ค่านี้เมื่อเชื่อมต่อพร็อกซีแบบกำหนดเองที่เข้ากันได้กับ DeepSeek ซึ่งปฏิเสธคำขอหลังจากเนื้อหาการให้เหตุผลถูกตัดออก ค่าเริ่มต้นคือ `false`

  </Accordion>
  <Accordion title="การค้นหา Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: รากการตั้งค่าการค้นหาอัตโนมัติของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิดการค้นหาโดยนัย
    - `plugins.entries.amazon-bedrock.config.discovery.region`: ภูมิภาค AWS สำหรับการค้นหา
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรองรหัสผู้ให้บริการซึ่งเป็นตัวเลือกสำหรับการค้นหาแบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลาการสำรวจเพื่อตรวจสอบการรีเฟรชการค้นหา
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: หน้าต่างบริบทสำรองสำหรับโมเดลที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: จำนวนโทเค็นเอาต์พุตสูงสุดสำรองสำหรับโมเดลที่ค้นพบ

  </Accordion>
</AccordionGroup>

การเริ่มต้นใช้งานผู้ให้บริการแบบกำหนดเองในโหมดโต้ตอบจะอนุมานอินพุตรูปภาพสำหรับรูปแบบรหัสโมเดลการมองเห็นที่รู้จัก ซึ่งรวมถึง GPT-4o/GPT-4.1/GPT-5+, ตระกูลการให้เหตุผล `o1`/`o3`/`o4`, Claude, Gemini, รหัสใด ๆ ที่ลงท้ายด้วย `-vl` (Qwen-VL และที่คล้ายกัน) และตระกูลที่มีชื่อ เช่น LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V และ GLM-4V โดยจะข้ามคำถามเพิ่มเติมสำหรับตระกูลที่ทราบว่ารองรับเฉพาะข้อความ (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama และรหัส Qwen เปล่าที่ไม่มีส่วนต่อท้าย vl/vision) รหัสโมเดลที่ไม่รู้จักจะยังคงแสดงคำถามเกี่ยวกับการรองรับรูปภาพ การเริ่มต้นใช้งานแบบไม่โต้ตอบใช้การอนุมานเดียวกัน ส่ง `--custom-image-input` เพื่อบังคับข้อมูลเมตาที่รองรับรูปภาพ หรือ `--custom-text-input` เพื่อบังคับข้อมูลเมตาที่รองรับเฉพาะข้อความ

### ตัวอย่างผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ผู้ให้บริการภายนอกอย่างเป็นทางการ `cerebras` สามารถกำหนดค่านี้ผ่าน `openclaw onboard --auth-choice cerebras-api-key` ใช้การกำหนดค่าผู้ให้บริการอย่างชัดเจนเฉพาะเมื่อต้องการแทนที่ค่าเริ่มต้น

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    ใช้ `cerebras/zai-glm-4.7` สำหรับ Cerebras และ `zai/glm-4.7` สำหรับการเชื่อมต่อ Z.AI โดยตรง

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    เข้ากันได้กับ Anthropic และเป็นผู้ให้บริการในตัว ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

  </Accordion>
  <Accordion title="โมเดลภายในเครื่อง (LM Studio)">
    ดู[โมเดลภายในเครื่อง](/th/gateway/local-models) สรุปสั้น ๆ: เรียกใช้โมเดลภายในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ประสิทธิภาพสูง และคงการผสานโมเดลแบบโฮสต์ไว้เพื่อใช้เป็นทางเลือกสำรอง
  </Accordion>
  <Accordion title="MiniMax M3 (โดยตรง)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    ตั้งค่า `MINIMAX_API_KEY` ทางลัด: `openclaw onboard --auth-choice minimax-global-api` หรือ `openclaw onboard --auth-choice minimax-cn-api` แค็ตตาล็อกโมเดลใช้ M3 เป็นค่าเริ่มต้นและมีรุ่นย่อย M2.7 รวมอยู่ด้วย บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic นั้น OpenClaw จะปิดการคิดของ MiniMax M2.x โดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` ด้วยตนเองอย่างชัดเจน ส่วน MiniMax-M3 (และ M3.x) จะยังคงใช้เส้นทางการคิดแบบละไว้/ปรับตามสถานการณ์ของผู้ให้บริการโดยค่าเริ่มต้น `/fast on` หรือ `params.fastMode: true` จะแปลง `MiniMax-M2.7` เป็น `MiniMax-M2.7-highspeed`

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    สำหรับปลายทางในจีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

    ปลายทางดั้งเดิมของ Moonshot ประกาศความเข้ากันได้กับข้อมูลการใช้งานแบบสตรีมบนการรับส่งข้อมูล `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw จะเปิดใช้คุณสมบัตินี้ตามความสามารถของปลายทาง แทนที่จะอิงเฉพาะ ID ผู้ให้บริการในตัว

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้การอ้างอิง `opencode/...` สำหรับแค็ตตาล็อก Zen หรือการอ้างอิง `opencode-go/...` สำหรับแค็ตตาล็อก Go ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

  </Accordion>
  <Accordion title="Synthetic (เข้ากันได้กับ Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    URL ฐานไม่ควรมี `/v1` (ไคลเอนต์ Anthropic จะเติมส่วนนี้ให้) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    ตั้งค่า `ZAI_API_KEY` การอ้างอิงโมเดลใช้ ID ผู้ให้บริการมาตรฐาน `zai/*` ทางลัด: `openclaw onboard --auth-choice zai-api-key`

    - ปลายทางทั่วไป: `https://api.z.ai/api/paas/v4`
    - ปลายทางสำหรับการเขียนโค้ด: `https://api.z.ai/api/coding/paas/v4`
    - ตัวเลือกการยืนยันตัวตน `zai-api-key` เริ่มต้นจะตรวจสอบคีย์ของคุณและตรวจหาโดยอัตโนมัติว่าคีย์นั้นเป็นของปลายทางใด (หากตรวจหาไม่ได้อย่างแน่ชัด ระบบจะเปลี่ยนไปถามและใช้ Global เป็นค่าเริ่มต้น) นอกจากนี้ยังมีตัวเลือกการยืนยันตัวตนเฉพาะสำหรับ CN และ Coding-Plan เพื่อให้เลือกได้อย่างชัดเจน
    - สำหรับปลายทางทั่วไป ให้กำหนดผู้ให้บริการแบบกำหนดเองพร้อมระบุ URL ฐานทับค่าเดิม

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — เอเจนต์](/th/gateway/config-agents)
- [การกำหนดค่า — ช่องทาง](/th/gateway/config-channels)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุดอื่น ๆ
- [เครื่องมือและ Plugin](/th/tools)
