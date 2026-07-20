---
read_when:
    - การกำหนดค่านโยบาย รายการที่อนุญาต หรือฟีเจอร์ทดลองของ `tools.*`
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือการแทนที่ URL ฐาน
    - การตั้งค่าเอนด์พอยต์ที่โฮสต์ด้วยตนเองซึ่งเข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่าเครื่องมือ (นโยบาย ตัวเลือกเปิดปิดฟีเจอร์ทดลอง เครื่องมือที่ทำงานผ่านผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/URL ฐานแบบกำหนดเอง
title: การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-07-20T06:00:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 690d3c0bf9a1a542c6989c74f0bc15c7e52798892436aa8bd710d22b00fcf015
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` คีย์การกำหนดค่าและการตั้งค่าผู้ให้บริการแบบกำหนดเอง / URL ฐาน สำหรับเอเจนต์ ช่องทาง และคีย์การกำหนดค่าระดับบนสุดอื่นๆ โปรดดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` กำหนดรายการอนุญาตพื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
การเริ่มต้นใช้งานภายในเครื่องจะตั้งค่าเริ่มต้นของการกำหนดค่าภายในเครื่องใหม่เป็น `tools.profile: "coding"` เมื่อยังไม่ได้กำหนด (โปรไฟล์ที่กำหนดไว้อย่างชัดเจนอยู่แล้วจะยังคงเดิม)
</Note>

| โปรไฟล์     | ประกอบด้วย                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | เฉพาะ `session_status`                                                                                                                                                                                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate`                |
| `messaging` | `group:messaging`, `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `ask_user` |
| `full`      | ไม่มีข้อจำกัด (เหมือนกับไม่ได้กำหนด)                                                                                                                                                                                                                          |

`coding` และ `messaging` ยังอนุญาต `bundle-mcp` (เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้) โดยปริยายด้วย

### กลุ่มเครื่องมือ

| กลุ่ม              | เครื่องมือ                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ใช้เป็นนามแฝงของ `exec` ได้)                                                                                                                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`, `screen`, `terminal`, `canvas`, `show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                                                   |
| `group:openclaw`   | เครื่องมือในตัวทั้งหมดข้างต้น ยกเว้น `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (ไม่รวมเครื่องมือของ Plugin)                                                                                                                                  |
| `group:plugins`    | เครื่องมือที่เป็นของ Plugin ที่โหลดแล้ว รวมถึงเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ซึ่งเปิดเผยผ่าน `bundle-mcp`                                                                                                                                                           |

`spawn_task` ช่วยให้เอเจนต์เขียนโค้ดสามารถเสนองานติดตามผลที่ได้รับการยืนยันแล้วโดยไม่เริ่มงานนั้น Control UI จะแสดงชื่อและข้อมูลสรุปเป็นชิปที่ดำเนินการได้ ส่วน TUI ที่มี Gateway รองรับจะแสดงพรอมต์แบบโต้ตอบที่เทียบเท่ากัน การยอมรับจากพื้นผิวใดพื้นผิวหนึ่งจะสร้างเซสชัน managed-worktree ใหม่และส่งพรอมต์ฉบับเต็มไปยังเซสชันนั้น ขณะที่เทิร์นปัจจุบันยังดำเนินต่อไป `dismiss_task` ถอนคำแนะนำที่ยังรอดำเนินการโดยใช้ `task_id` ชั่วคราวที่ส่งคืนจาก `spawn_task`

เครื่องมือเหล่านี้จะเสนอให้ใช้เฉพาะเมื่อพื้นผิวของผู้ดำเนินการที่เริ่มต้นสามารถรับและดำเนินการกับเหตุการณ์คำแนะนำงานของ Gateway ได้ เซสชันช่องทางและเซสชัน TUI ภายในเครื่อง/แบบฝังจะไม่ได้รับเหตุการณ์เหล่านี้ ส่วนการขนส่งของช่องทางต้องมีการดำเนินการงานแบบมีชนิดที่พกพาได้ก่อน จึงจะเปิดเผยขั้นตอนนี้ได้อย่างปลอดภัย คำแนะนำจะอยู่เฉพาะภายในโปรเซสและหายไปเมื่อ Gateway เริ่มใหม่ เครื่องมือทั้งสองยังคงอยู่ในโปรไฟล์ `coding` และ `group:sessions` ดังนั้นนโยบาย `tools.allow` และ `tools.deny` ตามปกติจะกำหนดค่าให้โดยอัตโนมัติเมื่อพื้นผิวรองรับ

### เครื่องมือ MCP และ Plugin ภายในนโยบายเครื่องมือของแซนด์บ็อกซ์

เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้จะเปิดเผยเป็นเครื่องมือที่ Plugin เป็นเจ้าของภายใต้รหัส Plugin `bundle-mcp` โปรไฟล์เครื่องมือตามปกติสามารถอนุญาตเครื่องมือเหล่านี้ได้ แต่ `tools.sandbox.tools` เป็นด่านเพิ่มเติมสำหรับเซสชันที่ทำงานในแซนด์บ็อกซ์ หากโหมดแซนด์บ็อกซ์เป็น `"all"` หรือ `"non-main"` ให้เพิ่มหนึ่งในรายการต่อไปนี้ลงในรายการอนุญาตเครื่องมือของแซนด์บ็อกซ์เมื่อต้องการให้มองเห็นเครื่องมือ MCP/Plugin:

- `bundle-mcp` สำหรับเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการจาก `mcp.servers`
- รหัส Plugin สำหรับ Plugin แบบเนทีฟที่ระบุ
- `group:plugins` สำหรับเครื่องมือที่ Plugin เป็นเจ้าของซึ่งโหลดแล้วทั้งหมด
- ชื่อเครื่องมือของเซิร์ฟเวอร์ MCP ที่ตรงกันทุกประการ หรือรูปแบบ glob ของเซิร์ฟเวอร์ เช่น `outlook__send_mail` หรือ `outlook__*` เมื่อต้องการเพียงเซิร์ฟเวอร์เดียว

รูปแบบ glob ของเซิร์ฟเวอร์ใช้คำนำหน้าของเซิร์ฟเวอร์ MCP ที่ปลอดภัยสำหรับผู้ให้บริการ ซึ่งไม่จำเป็นต้องตรงกับคีย์ `mcp.servers` ดิบ อักขระที่ไม่ใช่ `[A-Za-z0-9_-]` จะกลายเป็น `-` ชื่อที่ไม่ได้ขึ้นต้นด้วยตัวอักษรจะได้รับคำนำหน้า `mcp-` และคำนำหน้าที่ยาวหรือซ้ำกันอาจถูกตัดทอนหรือเติมส่วนต่อท้าย ตัวอย่างเช่น `mcp.servers["Outlook Graph"]` ใช้รูปแบบ glob เช่น `outlook-graph__*`

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

หากไม่มีรายการในชั้นแซนด์บ็อกซ์ดังกล่าว เซิร์ฟเวอร์ MCP ยังคงโหลดสำเร็จได้ แต่เครื่องมือจะถูกกรองออกก่อนคำขอไปยังผู้ให้บริการ ใช้ `openclaw doctor` เพื่อตรวจจับรูปแบบนี้สำหรับเซิร์ฟเวอร์ที่ OpenClaw จัดการใน `mcp.servers` เซิร์ฟเวอร์ MCP ที่โหลดจากรายการประกาศของ Plugin ที่รวมมาให้หรือ Claude `.mcp.json` ใช้ด่านแซนด์บ็อกซ์เดียวกัน แต่การวินิจฉัยนี้ยังไม่แจกแจงแหล่งเหล่านั้น หากเครื่องมือหายไปในเทิร์นที่ทำงานในแซนด์บ็อกซ์ ให้ใช้รายการอนุญาตเดียวกัน

### `tools.codeMode`

`tools.codeMode` เปิดใช้งานพื้นผิวโหมดโค้ดทั่วไปของ OpenClaw เมื่อเปิดใช้งาน
สำหรับการรันที่มีเครื่องมือ เครื่องมือ OpenClaw ตามปกติจะย้ายไปอยู่หลังบริดจ์แค็ตตาล็อก `tools.*`
ภายในแซนด์บ็อกซ์ และเครื่องมือ MCP จะพร้อมใช้งานผ่านเนมสเปซ `MCP`
ที่สร้างขึ้น โดยปกติโมเดลจะเห็น `exec` และ `wait`; ส่วนเครื่องมือ เช่น `computer`
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

รูปแบบย่อก็ใช้ได้เช่นกัน:

```json5
{
  tools: { codeMode: true },
}
```

การประกาศ MCP จะเปิดเผยผ่านพื้นผิวไฟล์ API เสมือนแบบอ่านอย่างเดียวใน
โหมดโค้ด โค้ดเกสต์สามารถเรียก `API.list("mcp")` และ
`API.read("mcp/<server>.d.ts")` เพื่อตรวจสอบลายเซ็นแบบ TypeScript ก่อน
เรียก `MCP.<server>.<tool>()` โปรดดู [โหมดโค้ด](/th/tools/code-mode) สำหรับ
สัญญารันไทม์ ขีดจำกัด และขั้นตอนการแก้ไขข้อบกพร่อง

### `tools.allow` / `tools.deny`

นโยบายอนุญาต/ปฏิเสธเครื่องมือส่วนกลาง (การปฏิเสธมีผลเหนือกว่า) ไม่คำนึงถึงตัวพิมพ์เล็ก-ใหญ่ และรองรับอักขระตัวแทน `*` นโยบายนี้จะมีผลแม้ปิดแซนด์บ็อกซ์ Docker

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` และ `apply_patch` เป็นรหัสเครื่องมือแยกกัน `allow: ["write"]` ยังเปิดใช้งาน `apply_patch` สำหรับโมเดลที่เข้ากันได้ด้วย แต่ `deny: ["write"]` ไม่ได้ปฏิเสธ `apply_patch` หากต้องการบล็อกการแก้ไขไฟล์ทั้งหมด ให้ปฏิเสธ `group:fs` หรือระบุเครื่องมือที่แก้ไขข้อมูลแต่ละรายการอย่างชัดเจน:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
ไม่สามารถกำหนด `allow` และ `alsoAllow` พร้อมกันในขอบเขตเดียวกัน (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) ได้ เพราะการตรวจสอบความถูกต้องของการกำหนดค่าจะปฏิเสธ ให้รวมรายการ `alsoAllow` เข้ากับ `allow` หรือนำ `allow` ออกแล้วใช้ `profile` + `alsoAllow` แทน
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

คีย์ใช้คำนำหน้าที่ระบุอย่างชัดเจน ได้แก่ `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` หรือ `"*"` รหัสช่องทางเป็นรหัสมาตรฐานของ OpenClaw ส่วนชื่อแทน เช่น `teams` จะถูกปรับให้อยู่ในรูป `msteams` คีย์แบบเดิมที่ไม่มีคำนำหน้าจะยอมรับเป็น `id:` เท่านั้น ลำดับการจับคู่คือ ช่องทาง+รหัส, รหัส, e164, ชื่อผู้ใช้, ชื่อ แล้วจึงไวลด์การ์ด

`agents.list[].tools.toolsBySender` ระดับเอเจนต์จะแทนที่การจับคู่ผู้ส่งส่วนกลางเมื่อจับคู่สำเร็จ แม้นโยบาย `{}` จะว่างเปล่าก็ตาม

### `tools.elevated`

ควบคุมการเข้าถึงการเรียกใช้แบบยกระดับภายนอกแซนด์บ็อกซ์:

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

- การแทนที่ระดับเอเจนต์ (`agents.list[].tools.elevated`) ทำได้เพียงจำกัดให้เข้มงวดยิ่งขึ้น
- `/elevated on|off|ask|full` จัดเก็บสถานะแยกตามเซสชัน ส่วนคำสั่งแบบอินไลน์มีผลกับข้อความเดียว
- `exec` แบบยกระดับจะข้ามการทำแซนด์บ็อกซ์และใช้เส้นทางหลบออกที่กำหนดค่าไว้ (ค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อเป้าหมายการเรียกใช้คือ `node`)

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

ค่าที่แสดงเป็นค่าเริ่มต้น ยกเว้น `applyPatch.allowModels` (ค่าเริ่มต้นว่าง/ไม่ได้ตั้งค่า หมายความว่าโมเดลที่เข้ากันได้ทุกโมเดลอาจใช้ `apply_patch`) `approvalRunningNoticeMs` จะแสดงการแจ้งเตือนว่ายังคงทำงานอยู่ เมื่อการเรียกใช้ที่อาศัยการอนุมัติทำงานเป็นเวลานาน ส่วน `0` จะปิดการทำงานนี้

### `tools.loopDetection`

การตรวจสอบความปลอดภัยของลูปเครื่องมือจะ **ปิดใช้งานโดยค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้การตรวจจับ สามารถกำหนดการตั้งค่าทั่วโลกใน `tools.loopDetection` และแทนที่แยกตามเอเจนต์ได้ที่ `agents.list[].tools.loopDetection`

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
    },
  },
}
```

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // หรือสภาพแวดล้อม BRAVE_API_KEY (ผู้ให้บริการ Brave)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // ไม่บังคับ; ละเว้นเพื่อให้ตรวจหาอัตโนมัติ
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

ค่าที่แสดงเป็นค่าเริ่มต้น ยกเว้น `provider` และ `userAgent` `maxResponseBytes` จะจำกัดให้อยู่ในช่วง 32000–10000000 ส่วน `maxChars` จะจำกัดไว้ที่ `maxCharsCap` (เพิ่ม `maxCharsCap` เพื่ออนุญาตการตอบกลับที่ใหญ่ขึ้น)

### `tools.media`

กำหนดค่าการทำความเข้าใจสื่อขาเข้า (รูปภาพ/เสียง/วิดีโอ):

```json5
{
  tools: {
    media: {
      concurrency: 2,
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

`concurrency` (ค่าเริ่มต้น `2`), `audio.maxBytes` (ค่าเริ่มต้น 20 MB) และ `video.maxBytes` (ค่าเริ่มต้น 50 MB) แสดงด้วยค่าเริ่มต้น ส่วน `image.maxBytes` มีค่าเริ่มต้นเป็น 10 MB ระยะหมดเวลาของคำขอเริ่มต้นแยกตามความสามารถ: รูปภาพ/เสียง `60` วินาที, วิดีโอ `120` วินาที

<AccordionGroup>
  <Accordion title="ฟิลด์รายการโมเดลสื่อ">
    **รายการผู้ให้บริการ** (`type: "provider"` หรือละเว้น):

    - `provider`: รหัสผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` เป็นต้น)
    - `model`: การแทนที่รหัสโมเดล
    - `profile` / `preferredProfile`: การเลือกโปรไฟล์ `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะเรียกใช้
    - `args`: อาร์กิวเมนต์แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` เป็นต้น โดย `openclaw doctor --fix` จะย้ายตัวยึดตำแหน่ง `{input}` ที่เลิกใช้แล้วไปเป็น `{{MediaPath}}`)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการที่ไม่บังคับ (`image`, `audio`, `video`) Plugin ของผู้ให้บริการแต่ละรายประกาศชุดความสามารถเริ่มต้นของตนเอง ตัวอย่างเช่น ผู้ให้บริการ `openai` ที่รวมมาให้มีค่าเริ่มต้นเป็นรูปภาพ+เสียง, `anthropic`/`minimax` เป็นรูปภาพ, `google` เป็นรูปภาพ+เสียง+วิดีโอ และ `groq` เป็นเสียง
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: การแทนที่แยกตามรายการ
    - `tools.media.image.timeoutSeconds` และรายการ `timeoutSeconds` ของโมเดลรูปภาพที่ตรงกันจะมีผลด้วยเมื่อเอเจนต์เรียกเครื่องมือ `image` โดยตรง สำหรับการทำความเข้าใจรูปภาพ ระยะหมดเวลานี้มีผลกับตัวคำขอเองและจะไม่ลดลงจากงานเตรียมการก่อนหน้า
    - เมื่อเกิดความล้มเหลว ระบบจะสำรองไปใช้รายการถัดไป

    การรับรองความถูกต้องของผู้ให้บริการเป็นไปตามลำดับมาตรฐาน: `auth-profiles.json` → ตัวแปรสภาพแวดล้อม → `models.providers.*.apiKey`

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

ควบคุมว่าเครื่องมือเซสชัน (`sessions_list`, `sessions_history`, `sessions_send`) สามารถกำหนดเป้าหมายเซสชันใดได้บ้าง

ค่าเริ่มต้น: `tree` (เซสชันปัจจุบัน + เซสชันที่เซสชันนี้สร้างขึ้น เช่น เอเจนต์ย่อย รวมถึงเซสชันกลุ่มที่เฝ้าดูโดยรอบสำหรับเอเจนต์เดียวกัน)

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
  <Accordion title="ขอบเขตการมองเห็น">
    - `self`: เฉพาะคีย์ของเซสชันปัจจุบัน
    - `tree`: เซสชันปัจจุบัน + เซสชันที่เซสชันปัจจุบันสร้างขึ้น (เอเจนต์ย่อย) สำหรับการดำเนินการอ่าน ยังรวมถึงเซสชันกลุ่มของเอเจนต์เดียวกันที่เซสชันปัจจุบันเฝ้าดูผ่านการรับรู้กลุ่มโดยรอบ
    - `agent`: เซสชันใดก็ตามที่เป็นของรหัสเอเจนต์ปัจจุบัน (อาจรวมผู้ใช้รายอื่น หากเรียกใช้เซสชันแยกตามผู้ส่งภายใต้รหัสเอเจนต์เดียวกัน)
    - `all`: เซสชันใดก็ได้ การกำหนดเป้าหมายข้ามเอเจนต์ยังคงต้องใช้ `tools.agentToAgent`
    - ข้อจำกัดของแซนด์บ็อกซ์: เมื่อเซสชันปัจจุบันอยู่ในแซนด์บ็อกซ์และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (ค่าเริ่มต้น) การมองเห็นจะถูกบังคับเป็น `tree` แม้ว่า `tools.sessions.visibility="all"`
    - เมื่อไม่ใช่ `all` `sessions_list` จะมีฟิลด์ `visibility` แบบกระชับ
      ซึ่งอธิบายโหมดที่มีผลจริงและคำเตือนว่าเซสชันบางส่วนอาจถูก
      ละเว้นเมื่ออยู่นอกขอบเขตปัจจุบัน

  </Accordion>
</AccordionGroup>

เมื่อใช้ค่าเริ่มต้น `session.dmScope: "main"` กิจกรรมของมนุษย์ในกลุ่มจะทำให้เซสชันกลุ่มของเอเจนต์เดียวกันนั้นมองเห็นได้โดยรอบจากเซสชันหลักของเอเจนต์ ในการตั้งค่าแบบหลายผู้ใช้ `"main"` ยังใช้เซสชัน DM เดียวร่วมกันระหว่างผู้ใช้ ดังนั้นผู้ใช้แต่ละรายที่ถูกกำหนดเส้นทางมายังเซสชันนั้นจึงสามารถอ่านข้อมูลจากกลุ่มที่เฝ้าดูโดยรอบได้ รวมถึงผ่าน `memory_search` ของหน่วยความจำเซสชัน ใช้ `dmScope` แยกตามคู่สนทนาเพื่อแยก DM หรือกำหนด `tools.sessions.visibility: "self"` เพื่อไม่เข้าร่วมการอ่านเซสชันที่เฝ้าดูโดยรอบ

### `tools.sessions_spawn`

ควบคุมการรองรับไฟล์แนบแบบอินไลน์สำหรับ `sessions_spawn`

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // ต้องเลือกเปิดใช้: ตั้งค่าเป็น true เพื่ออนุญาตไฟล์แนบแบบอินไลน์
        maxTotalBytes: 5242880, // รวมสูงสุด 5 MB สำหรับทุกไฟล์
        maxFiles: 50,
        maxFileBytes: 1048576, // สูงสุด 1 MB ต่อไฟล์
        retainOnSessionKeep: false, // เก็บไฟล์แนบไว้เมื่อ cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับไฟล์แนบ">
    - ไฟล์แนบต้องใช้ `enabled: true`
    - ไฟล์แนบของเอเจนต์ย่อยจะถูกสร้างเป็นไฟล์จริงในพื้นที่ทำงานลูกที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
    - ไฟล์แนบ ACP รองรับเฉพาะรูปภาพและจะถูกส่งต่อแบบอินไลน์ไปยังรันไทม์ ACP หลังผ่านขีดจำกัดเดียวกันสำหรับจำนวนไฟล์ จำนวนไบต์ต่อไฟล์ และจำนวนไบต์รวม
    - เนื้อหาไฟล์แนบจะถูกปกปิดจากการคงอยู่ของบันทึกบทสนทนาโดยอัตโนมัติ
    - อินพุต Base64 จะได้รับการตรวจสอบตัวอักษร/แพดดิงอย่างเข้มงวดและมีการป้องกันขนาดก่อนถอดรหัส
    - สิทธิ์ของไฟล์แนบเอเจนต์ย่อยคือ `0700` สำหรับไดเรกทอรีและ `0600` สำหรับไฟล์
    - การล้างข้อมูลของเอเจนต์ย่อยเป็นไปตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ ส่วน `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือในตัวแบบทดลอง ปิดโดยค่าเริ่มต้น เว้นแต่กฎเปิดใช้อัตโนมัติสำหรับ GPT-5 แบบ strict-agentic จะมีผล

```json5
{
  tools: {
    experimental: {
      planTool: true, // เปิดใช้ update_plan แบบทดลอง
    },
  },
}
```

- `planTool`: เปิดใช้เครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับติดตามงานหลายขั้นตอนที่ไม่ใช่งานเล็กน้อย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedAgent.executionContract` (หรือการแทนที่ระดับเอเจนต์) จะถูกตั้งเป็น `"strict-agentic"` สำหรับการเรียกใช้ผู้ให้บริการ `openai` กับรหัสโมเดลตระกูล GPT-5 (ครอบคลุมการเรียกใช้ OpenAI Codex CLI ด้วย เนื่องจากการกำหนดเส้นทางการรับรองความถูกต้อง/โมเดลของ Codex อยู่ภายใต้ผู้ให้บริการ `openai`) ตั้งค่า `true` เพื่อบังคับเปิดเครื่องมือนอกขอบเขตดังกล่าว หรือ `false` เพื่อให้เครื่องมือยังคงปิดแม้ในการเรียกใช้ GPT-5 แบบ strict-agentic
- เมื่อเปิดใช้งาน พรอมต์ระบบจะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้เครื่องมือนี้เฉพาะกับงานขนาดใหญ่และมีขั้นตอน `in_progress` ได้พร้อมกันไม่เกินหนึ่งขั้นตอน

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

- `model`: โมเดลเริ่มต้นสำหรับ sub-agent ที่สร้างขึ้น หากละไว้ sub-agent จะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: รายการอนุญาตเริ่มต้นของรหัสเอเจนต์เป้าหมายที่กำหนดค่าไว้สำหรับ `sessions_spawn` เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตนเอง (`["*"]` = เป้าหมายใดก็ได้ที่กำหนดค่าไว้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน) รายการเก่าที่การกำหนดค่าเอเจนต์ถูกลบแล้วจะถูก `sessions_spawn` ปฏิเสธและละไว้จาก `agents_list`; เรียกใช้ `openclaw doctor --fix` เพื่อล้างรายการเหล่านั้น
- `maxConcurrent`: จำนวนการทำงานของ sub-agent พร้อมกันสูงสุด ค่าเริ่มต้น: `8`
- `runTimeoutSeconds`: ระยะหมดเวลา (วินาที) สำหรับ `sessions_spawn` เมื่อผู้เรียกไม่ได้ส่งค่าทดแทนของตนเอง ค่าเริ่มต้น: `0` (ไม่มีระยะหมดเวลา); `900` ที่แสดงด้านบนเป็นค่าที่นิยมเลือกใช้ ไม่ใช่ค่าเริ่มต้นในตัว
- `announceTimeoutMs`: ระยะหมดเวลาต่อการเรียก (มิลลิวินาที) สำหรับความพยายามส่งประกาศ `agent` ของ Gateway ค่าเริ่มต้น: `120000` การลองใหม่สำหรับข้อผิดพลาดชั่วคราวอาจทำให้เวลารอประกาศรวมยาวนานกว่าระยะหมดเวลาที่กำหนดไว้หนึ่งช่วง
- `archiveAfterMinutes`: จำนวนนาทีหลังจากเซสชัน sub-agent เสร็จสิ้นก่อนที่จะถูกเก็บถาวรโดยอัตโนมัติ ค่าเริ่มต้น: `60`; `0` ปิดใช้งานการเก็บถาวรอัตโนมัติ
- นโยบายเครื่องมือต่อ sub-agent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## ผู้ให้บริการและ URL ฐานแบบกำหนดเอง

Plugin ของผู้ให้บริการเผยแพร่แถวแค็ตตาล็อกโมเดลของตนเอง เพิ่มผู้ให้บริการแบบกำหนดเองผ่าน `models.providers` ในการกำหนดค่าหรือ `~/.openclaw/agents/<agentId>/agent/models.json`

การกำหนดค่า `baseUrl` ของผู้ให้บริการแบบกำหนดเอง/ภายในเครื่องยังเป็นการตัดสินใจด้านความเชื่อถือของเครือข่ายแบบจำกัดขอบเขตสำหรับคำขอ HTTP ของโมเดลด้วย: OpenClaw อนุญาตต้นทาง `scheme://host:port` ที่ตรงกันทุกประการผ่านเส้นทาง fetch ที่มีการป้องกัน โดยไม่เพิ่มตัวเลือกการกำหนดค่าแยกต่างหากหรือเชื่อถือต้นทางส่วนตัวอื่น ๆ

```json5
{
  models: {
    mode: "merge", // ผสาน (ค่าเริ่มต้น) | แทนที่
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | ฯลฯ
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
  <Accordion title="การยืนยันตัวตนและลำดับความสำคัญในการผสาน">
    - ใช้ `authHeader: true` + `headers` สำหรับความต้องการด้านการยืนยันตัวตนแบบกำหนดเอง
    - แทนที่รากการกำหนดค่าเอเจนต์ด้วย `OPENCLAW_AGENT_DIR`
    - ลำดับความสำคัญในการผสานสำหรับรหัสผู้ให้บริการที่ตรงกัน:
      - ค่า `baseUrl` ของ `models.json` สำหรับเอเจนต์ที่ไม่ว่างเปล่ามีลำดับความสำคัญ
      - ค่า `apiKey` สำหรับเอเจนต์ที่ไม่ว่างเปล่ามีลำดับความสำคัญเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้รับการจัดการด้วย SecretRef ในบริบทการกำหนดค่า/โปรไฟล์การยืนยันตัวตนปัจจุบัน
      - ค่า `apiKey` ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจากเครื่องหมายแหล่งที่มา (`ENV_VAR_NAME` สำหรับการอ้างอิง env, `secretref-managed` สำหรับการอ้างอิงไฟล์/exec) แทนการคงค่าข้อมูลลับที่แก้ไขแล้ว
      - ค่าของส่วนหัวผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจากเครื่องหมายแหล่งที่มา (`secretref-env:ENV_VAR_NAME` สำหรับการอ้างอิง env, `secretref-managed` สำหรับการอ้างอิงไฟล์/exec)
      - `apiKey`/`baseUrl` สำหรับเอเจนต์ที่ว่างเปล่าหรือไม่มีอยู่จะย้อนกลับไปใช้ `models.providers` ในการกำหนดค่า
      - `contextWindow`/`maxTokens` ของโมเดลที่ตรงกัน: ค่าการกำหนดค่าที่ระบุชัดเจนมีลำดับความสำคัญเมื่อมีอยู่และถูกต้อง (จำนวนจำกัดที่เป็นบวก); มิฉะนั้นจะใช้ค่าแค็ตตาล็อกโดยนัย/ที่สร้างขึ้น
      - `contextTokens` ของโมเดลที่ตรงกันใช้กฎเดียวกันคือค่าที่ระบุชัดเจนมีลำดับความสำคัญ มิฉะนั้นใช้ค่าโดยนัย; ใช้ค่านี้เพื่อจำกัดบริบทที่มีผลโดยไม่เปลี่ยนข้อมูลเมตาดั้งเดิมของโมเดล
      - แค็ตตาล็อกของ Plugin ผู้ให้บริการจะถูกจัดเก็บเป็นส่วนย่อยของแค็ตตาล็อกที่สร้างขึ้นและเป็นของ Plugin ภายใต้สถานะ Plugin ของเอเจนต์
      - ใช้ `models.mode: "replace"` เมื่อต้องการให้การกำหนดค่าเขียน `models.json` ใหม่ทั้งหมดและข้ามการผสานส่วนย่อยของแค็ตตาล็อกที่เป็นของ Plugin
      - การคงอยู่ของเครื่องหมายยึดแหล่งที่มาเป็นหลัก: เครื่องหมายจะถูกเขียนจากสแนปช็อตการกำหนดค่าแหล่งที่มาที่ใช้งานอยู่ (ก่อนการแก้ไขค่า) ไม่ใช่จากค่าข้อมูลลับขณะรันไทม์ที่แก้ไขแล้ว

  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ผู้ให้บริการ

<AccordionGroup>
  <Accordion title="แค็ตตาล็อกระดับบนสุด">
    - `models.mode`: ลักษณะการทำงานของแค็ตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
    - `models.providers`: แมปผู้ให้บริการแบบกำหนดเองที่ใช้รหัสผู้ให้บริการเป็นคีย์
      - การแก้ไขอย่างปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเติม `config set` จะปฏิเสธการแทนที่ที่เป็นการทำลายเว้นแต่จะส่ง `--replace`

  </Accordion>
  <Accordion title="การเชื่อมต่อและการยืนยันตัวตนของผู้ให้บริการ">
    - `models.providers.*.api`: อะแดปเตอร์คำขอ (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`) สำหรับแบ็กเอนด์ `/v1/chat/completions` ที่โฮสต์เอง เช่น MLX, vLLM, SGLang และเซิร์ฟเวอร์ภายในเครื่องที่เข้ากันได้กับ OpenAI ส่วนใหญ่ ให้ใช้ `openai-completions` ผู้ให้บริการแบบกำหนดเองที่มี `baseUrl` แต่ไม่มี `api` จะใช้ `openai-completions` เป็นค่าเริ่มต้น; ตั้งค่า `openai-responses` เฉพาะเมื่อแบ็กเอนด์รองรับ `/v1/responses`
    - `models.providers.*.apiKey`: ข้อมูลประจำตัวของผู้ให้บริการ (ควรใช้การแทนที่ด้วย SecretRef/env)
    - `models.providers.*.auth`: กลยุทธ์การยืนยันตัวตน (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.contextWindow`: หน้าต่างบริบทดั้งเดิมเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextWindow`
    - `models.providers.*.contextTokens`: ขีดจำกัดบริบทขณะรันไทม์ที่มีผลเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextTokens`
    - `models.providers.*.maxTokens`: ขีดจำกัดโทเค็นเอาต์พุตเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้เมื่อรายการโมเดลไม่ได้ตั้งค่า `maxTokens`
    - `models.providers.*.timeoutSeconds`: ระยะหมดเวลาคำขอ HTTP ของโมเดลต่อผู้ให้บริการแบบเลือกได้ในหน่วยวินาที ซึ่งรวมการเชื่อมต่อ ส่วนหัว เนื้อหา และการจัดการยกเลิกคำขอทั้งหมด
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้แทรก `options.num_ctx` ลงในคำขอ (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับการส่งข้อมูลประจำตัวในส่วนหัว `Authorization` เมื่อจำเป็น
    - `models.providers.*.baseUrl`: URL ฐานของ API ต้นทาง
    - `models.providers.*.headers`: ส่วนหัวแบบคงที่เพิ่มเติมสำหรับการกำหนดเส้นทางพร็อกซี/ผู้เช่า

  </Accordion>
  <Accordion title="การแทนที่การส่งคำขอ">
    `models.providers.*.request`: การแทนที่การส่งสำหรับคำขอ HTTP ของผู้ให้บริการโมเดล

    - `request.headers`: ส่วนหัวเพิ่มเติม (ผสานกับค่าเริ่มต้นของผู้ให้บริการ) ค่ารองรับ SecretRef
    - `request.auth`: การแทนที่กลยุทธ์การยืนยันตัวตน โหมด: `"provider-default"` (ใช้การยืนยันตัวตนในตัวของผู้ให้บริการ), `"authorization-bearer"` (ร่วมกับ `token`), `"header"` (ร่วมกับ `headerName`, `value`, และ `prefix` ซึ่งเป็นตัวเลือก)
    - `request.proxy`: การแทนที่พร็อกซี HTTP โหมด: `"env-proxy"` (ใช้ตัวแปร env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (ร่วมกับ `url`) ทั้งสองโหมดยอมรับออบเจ็กต์ย่อย `tls` ซึ่งเป็นตัวเลือก
    - `request.tls`: การแทนที่ TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรองรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` ให้อนุญาตคำขอ HTTP ของผู้ให้บริการโมเดลไปยังช่วงที่อยู่ส่วนตัว, CGNAT หรือช่วงที่คล้ายกันผ่านตัวป้องกัน fetch HTTP ของผู้ให้บริการ URL ฐานของผู้ให้บริการแบบกำหนดเอง/ภายในเครื่องเชื่อถือต้นทางที่กำหนดไว้ตรงกันทุกประการอยู่แล้ว ยกเว้นต้นทางเมตาดาตา/ลิงก์โลคัล ซึ่งยังคงถูกบล็อกหากไม่มีการเลือกใช้อย่างชัดเจน ตั้งค่านี้เป็น `false` เพื่อยกเลิกความเชื่อถือต้นทางที่ตรงกันทุกประการ WebSocket ใช้ `request` เดียวกันสำหรับส่วนหัว/TLS แต่ไม่ใช้เกต SSRF ของ fetch ดังกล่าว ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="รายการแค็ตตาล็อกโมเดล">
    - `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของผู้ให้บริการที่ระบุชัดเจน
    - `models.providers.*.models.*.input`: รูปแบบอินพุตของโมเดล ใช้ `["text"]` สำหรับโมเดลที่รองรับเฉพาะข้อความ และ `["text", "image"]` สำหรับโมเดลภาพ/การมองเห็นดั้งเดิม ไฟล์แนบรูปภาพจะถูกแทรกลงในการทำงานของเอเจนต์เฉพาะเมื่อโมเดลที่เลือกถูกระบุว่ารองรับรูปภาพ
    - `models.providers.*.models.*.contextWindow`: ข้อมูลเมตาหน้าต่างบริบทดั้งเดิมของโมเดล ค่านี้จะแทนที่ `contextWindow` ระดับผู้ให้บริการสำหรับโมเดลนั้น
    - `models.providers.*.models.*.contextTokens`: ขีดจำกัดบริบทขณะรันไทม์แบบเลือกได้ ค่านี้จะแทนที่ `contextTokens` ระดับผู้ให้บริการ; ใช้เมื่อต้องการงบประมาณบริบทที่มีผลน้อยกว่า `contextWindow` ดั้งเดิมของโมเดล; `openclaw models list` จะแสดงทั้งสองค่าเมื่อแตกต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: คำแนะนำด้านความเข้ากันได้แบบเลือกได้ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` แบบไม่ใช่ค่าดั้งเดิมและไม่ว่างเปล่า (โฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ขณะรันไทม์ `baseUrl` ที่ว่างเปล่าหรือถูกละไว้จะคงลักษณะการทำงานเริ่มต้นของ OpenAI
    - `models.providers.*.models.*.compat.requiresStringContent`: คำแนะนำด้านความเข้ากันได้แบบเลือกได้สำหรับปลายทางแชตที่เข้ากันได้กับ OpenAI และรองรับเฉพาะสตริง เมื่อเป็น `true` OpenClaw จะแปลงอาร์เรย์ `messages[].content` ที่เป็นข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.strictMessageKeys`: คำแนะนำด้านความเข้ากันได้แบบเลือกได้สำหรับปลายทางแชตที่เข้ากันได้กับ OpenAI อย่างเคร่งครัด เมื่อเป็น `true` OpenClaw จะลดรูปออบเจ็กต์ข้อความ Chat Completions ขาออกให้เหลือ `role` และ `content` ก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.thinkingFormat`: คำแนะนำเพย์โหลดการคิดแบบเลือกได้ ใช้ `"together"` สำหรับ `reasoning.enabled` แบบ Together, `"qwen"` สำหรับ `enable_thinking` ระดับบนสุด หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ในตระกูล Qwen ซึ่งรองรับอาร์กิวเมนต์คีย์เวิร์ดของเทมเพลตแชตระดับคำขอ เช่น vLLM โมเดล Qwen ของ vLLM ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารี (`off`, `on`) สำหรับรูปแบบเหล่านี้
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: คำแนะนำด้านความเข้ากันได้แบบเลือกได้สำหรับแบ็กเอนด์ Chat Completions แบบ DeepSeek ซึ่งกำหนดให้ข้อความผู้ช่วยก่อนหน้ายังคงมี `reasoning_content` เมื่อเล่นซ้ำ เมื่อเป็น `true` OpenClaw จะคงฟิลด์นั้นไว้ในข้อความผู้ช่วยขาออก ใช้ค่านี้เมื่อต่อพร็อกซีแบบกำหนดเองที่เข้ากันได้กับ DeepSeek ซึ่งปฏิเสธคำขอหลังจากข้อมูลการให้เหตุผลถูกตัดออก ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="การค้นหา Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: รากการตั้งค่าการค้นหาอัตโนมัติของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิดการค้นหาโดยนัย
    - `plugins.entries.amazon-bedrock.config.discovery.region`: รีเจียน AWS สำหรับการค้นหา
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรองรหัสผู้ให้บริการแบบเลือกได้สำหรับการค้นหาแบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลาการสำรวจเพื่อตรวจสอบการรีเฟรชการค้นหา
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: หน้าต่างบริบทสำรองสำหรับโมเดลที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: จำนวนโทเค็นเอาต์พุตสูงสุดสำรองสำหรับโมเดลที่ค้นพบ

  </Accordion>
</AccordionGroup>

การเริ่มต้นใช้งานผู้ให้บริการแบบกำหนดเองในโหมดโต้ตอบจะอนุมานการรองรับอินพุตรูปภาพสำหรับรูปแบบรหัสโมเดลวิชันที่รู้จัก รวมถึง GPT-4o/GPT-4.1/GPT-5+, กลุ่มโมเดลการให้เหตุผล `o1`/`o3`/`o4`, Claude, Gemini, รหัสใดๆ ที่ลงท้ายด้วย `-vl` (Qwen-VL และโมเดลที่คล้ายกัน) และกลุ่มโมเดลที่ระบุชื่อ เช่น LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V และ GLM-4V โดยจะข้ามคำถามเพิ่มเติมสำหรับกลุ่มโมเดลที่ทราบว่ารองรับเฉพาะข้อความ (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama และรหัส Qwen แบบไม่มีส่วนต่อท้าย vl/vision) รหัสโมเดลที่ไม่รู้จักจะยังคงแสดงคำถามเกี่ยวกับการรองรับรูปภาพ การเริ่มต้นใช้งานแบบไม่โต้ตอบใช้การอนุมานแบบเดียวกัน โดยส่ง `--custom-image-input` เพื่อบังคับใช้เมทาดาทาที่รองรับรูปภาพ หรือ `--custom-text-input` เพื่อบังคับใช้เมทาดาทาที่รองรับเฉพาะข้อความ

### ตัวอย่างผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ผู้ให้บริการภายนอกอย่างเป็นทางการ `cerebras` สามารถกำหนดค่านี้ผ่าน `openclaw onboard --auth-choice cerebras-api-key` ได้ ใช้การกำหนดค่าผู้ให้บริการโดยตรงเฉพาะเมื่อต้องการเขียนทับค่าเริ่มต้นเท่านั้น

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

    เป็นผู้ให้บริการในตัวที่เข้ากันได้กับ Anthropic ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

  </Accordion>
  <Accordion title="โมเดลภายในเครื่อง (LM Studio)">
    ดู[โมเดลภายในเครื่อง](/th/gateway/local-models) สรุปสั้นๆ: เรียกใช้โมเดลภายในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ประสิทธิภาพสูง และคงโมเดลที่โฮสต์ไว้แบบผสานเพื่อใช้เป็นโมเดลสำรอง
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

    ตั้งค่า `MINIMAX_API_KEY` ทางลัด: `openclaw onboard --auth-choice minimax-global-api` หรือ `openclaw onboard --auth-choice minimax-cn-api` แค็ตตาล็อกโมเดลมีค่าเริ่มต้นเป็น M3 และมีรุ่นย่อย M2.7 รวมอยู่ด้วย บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic นั้น OpenClaw จะปิดการคิดของ MiniMax M2.x ตามค่าเริ่มต้น เว้นแต่จะตั้งค่า `thinking` ด้วยตนเองอย่างชัดเจน ส่วน MiniMax-M3 (และ M3.x) จะยังคงใช้เส้นทางการคิดแบบละเว้น/ปรับเปลี่ยนได้ของผู้ให้บริการตามค่าเริ่มต้น `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

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

    ปลายทางดั้งเดิมของ Moonshot ประกาศความเข้ากันได้กับข้อมูลการใช้งานแบบสตรีมมิงบนการขนส่ง `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw จะพิจารณาค่านี้จากความสามารถของปลายทาง ไม่ใช่จากรหัสผู้ให้บริการในตัวเพียงอย่างเดียว

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
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
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
                id: "hf:MiniMaxAI/MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    URL ฐานควรละเว้น `/v1` (ไคลเอนต์ Anthropic จะต่อท้ายให้) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

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

    ตั้งค่า `ZAI_API_KEY` การอ้างอิงโมเดลใช้รหัสผู้ให้บริการมาตรฐาน `zai/*` ทางลัด: `openclaw onboard --auth-choice zai-api-key`

    - ปลายทางทั่วไป: `https://api.z.ai/api/paas/v4`
    - ปลายทางสำหรับการเขียนโค้ด: `https://api.z.ai/api/coding/paas/v4`
    - ตัวเลือกการยืนยันตัวตนเริ่มต้น `zai-api-key` จะตรวจสอบคีย์และตรวจหาโดยอัตโนมัติว่าคีย์นั้นเป็นของปลายทางใด (หากตรวจหาไม่ได้ข้อสรุป ระบบจะแสดงพรอมต์และใช้ Global เป็นค่าเริ่มต้น) นอกจากนี้ยังมีตัวเลือกการยืนยันตัวตน CN และ Coding-Plan แยกเฉพาะสำหรับการเลือกอย่างชัดเจน
    - สำหรับปลายทางทั่วไป ให้กำหนดผู้ให้บริการแบบกำหนดเองพร้อมเขียนทับ URL ฐาน

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — เอเจนต์](/th/gateway/config-agents)
- [การกำหนดค่า — ช่องทาง](/th/gateway/config-channels)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุดอื่นๆ
- [เครื่องมือและ Plugin](/th/tools)
