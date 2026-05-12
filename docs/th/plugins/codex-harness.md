---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่า harness ของ Codex
    - คุณต้องการให้การปรับใช้แบบ Codex เท่านั้นล้มเหลว แทนที่จะย้อนกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนสแอปเซิร์ฟเวอร์ Codex ที่มาพร้อมในแพ็กเกจ
title: ฮาร์เนสของ Codex
x-i18n:
    generated_at: "2026-05-12T00:59:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่รวมมาพร้อม OpenClaw ช่วยให้ OpenClaw รัน turn ของ agent OpenAI แบบฝังตัว
ผ่าน Codex app-server แทน PI harness ที่มีในตัว

ใช้ Codex harness เมื่อคุณต้องการให้ Codex เป็นผู้ดูแล session ของ agent ระดับล่าง:
การ resume thread แบบ native, การ continuation ของเครื่องมือแบบ native, compaction แบบ native และ
การ execution ผ่าน app-server OpenClaw ยังคงดูแล chat channels, session files, การเลือก model,
OpenClaw dynamic tools, approvals, การส่ง media และ transcript mirror ที่มองเห็นได้

การตั้งค่าปกติใช้ model refs ของ OpenAI แบบ canonical เช่น `openai/gpt-5.5`
อย่ากำหนดค่า model refs `openai-codex/gpt-*` วางลำดับ auth ของ OpenAI agent
ไว้ใต้ `auth.order.openai`; profiles รุ่นเก่า `openai-codex:*` และ
รายการ `auth.order.openai-codex` ยังคงรองรับสำหรับการติดตั้งที่มีอยู่

OpenClaw เริ่ม thread ของ Codex app-server ด้วยโหมด code ของ Codex แบบ native และ
เปิดใช้ code-mode-only ซึ่งทำให้ OpenClaw dynamic tools แบบ deferred/searchable
อยู่ภายใน code execution และ tool-search surface ของ Codex เอง แทนการเพิ่ม
wrapper สำหรับ tool-search แบบ PI ทับบน Codex

สำหรับการแยก model/provider/runtime ในภาพรวม ให้เริ่มจาก
[Agent runtimes](/th/concepts/agent-runtimes) ฉบับสั้นคือ:
`openai/gpt-5.5` คือ model ref, `codex` คือ runtime และ Telegram,
Discord, Slack หรือ channel อื่นยังคงเป็นพื้นผิวการสื่อสาร

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` ที่รวมมาพร้อมใช้งาน
- หาก config ของคุณใช้ `plugins.allow` ให้รวม `codex`
- Codex app-server `0.125.0` หรือใหม่กว่า Plugin ที่รวมมาพร้อมจะจัดการ binary ของ
  Codex app-server ที่เข้ากันได้ตามค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH` จะไม่
  ส่งผลต่อการเริ่ม harness ปกติ
- Codex auth ที่พร้อมใช้งานผ่าน `openclaw models auth login --provider openai-codex`,
  บัญชี app-server ใน Codex home ของ agent หรือ auth profile แบบ Codex API-key
  ที่ระบุชัดเจน

สำหรับลำดับความสำคัญของ auth, การแยก environment, คำสั่ง app-server แบบกำหนดเอง, การค้นพบ model
และทุกฟิลด์ config โปรดดู
[ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## เริ่มต้นอย่างรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ Codex ใน OpenClaw ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
subscription ของ ChatGPT/Codex, เปิดใช้ Plugin `codex` ที่รวมมาพร้อม และใช้
model ref `openai/gpt-*` แบบ canonical

ลงชื่อเข้าใช้ด้วย Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

เปิดใช้ Plugin `codex` ที่รวมมาพร้อมและเลือก model ของ OpenAI agent:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

หาก config ของคุณใช้ `plugins.allow` ให้เพิ่ม `codex` ที่นั่นด้วย:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

รีสตาร์ท gateway หลังเปลี่ยน config ของ Plugin หากแชตที่มีอยู่มี session แล้ว
ให้ใช้ `/new` หรือ `/reset` ก่อนทดสอบการเปลี่ยน runtime เพื่อให้ turn ถัดไป
resolve harness จาก config ปัจจุบัน

## การกำหนดค่า

config ใน quickstart คือ config ขั้นต่ำที่ใช้งานได้สำหรับ Codex harness ตั้งค่า
ตัวเลือก Codex harness ใน config ของ OpenClaw และใช้ CLI สำหรับ Codex auth เท่านั้น:

| ความต้องการ                                   | ตั้งค่า                                                                              | ที่ไหน                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| เปิดใช้ harness                     | `plugins.entries.codex.enabled: true`                                            | config ของ OpenClaw                    |
| คงการติดตั้ง Plugin ที่อยู่ใน allowlist     | รวม `codex` ใน `plugins.allow`                                               | config ของ OpenClaw                    |
| route turn ของ OpenAI agent ผ่าน Codex | `agents.defaults.model` หรือ `agents.list[].model` เป็น `openai/gpt-*`               | config ของ OpenClaw agent              |
| ลงชื่อเข้าใช้ด้วย Codex OAuth               | `openclaw models auth login --provider openai-codex`                             | CLI auth profile                   |
| เพิ่ม API-key สำรองสำหรับการรัน Codex      | profile API-key `openai:*` ที่ระบุหลัง subscription auth ใน `auth.order.openai` | CLI auth profile + config ของ OpenClaw |
| fail closed เมื่อ Codex ไม่พร้อมใช้งาน  | Provider หรือ model `agentRuntime.id: "codex"`                                     | config ของ OpenClaw model/provider     |
| ใช้ traffic ของ OpenAI API โดยตรง          | Provider หรือ model `agentRuntime.id: "pi"` พร้อม OpenAI auth ปกติ                | config ของ OpenClaw model/provider     |
| ปรับพฤติกรรม app-server               | `plugins.entries.codex.config.appServer.*`                                       | config ของ Codex Plugin                |
| เปิดใช้แอป Codex Plugin แบบ native        | `plugins.entries.codex.config.codexPlugins.*`                                    | config ของ Codex Plugin                |
| เปิดใช้ Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | config ของ Codex Plugin                |

ใช้ model refs `openai/gpt-*` สำหรับ turn ของ OpenAI agent ที่มี Codex เป็น backend ควรใช้
`auth.order.openai` สำหรับลำดับแบบ subscription-first/API-key-backup profile auth
`openai-codex:*` ที่มีอยู่และ `auth.order.openai-codex` ยังคงใช้ได้ แต่
อย่าเขียน model refs `openai-codex/gpt-*` ใหม่

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ในรูปแบบนั้น ทั้งสอง profiles ยังคงรันผ่าน Codex สำหรับ turn ของ agent
`openai/gpt-*` API key เป็นเพียง auth fallback ไม่ใช่คำขอให้สลับไป PI หรือ
OpenAI Responses แบบ plain

ส่วนที่เหลือของหน้านี้ครอบคลุมตัวเลือกทั่วไปที่ผู้ใช้ต้องเลือก:
รูปแบบ deployment, การ route แบบ fail-closed, นโยบาย guardian approval, Codex
plugins แบบ native และ Computer Use สำหรับรายการตัวเลือกทั้งหมด, defaults, enums, การค้นพบ,
การแยก environment, timeouts และฟิลด์ transport ของ app-server โปรดดู
[ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## ตรวจสอบ Codex runtime

ใช้ `/status` ในแชตที่คุณคาดว่าจะใช้ Codex turn ของ OpenAI agent
ที่มี Codex เป็น backend จะแสดง:

```text
Runtime: OpenAI Codex
```

จากนั้นตรวจสอบสถานะ Codex app-server:

```text
/codex status
/codex models
```

`/codex status` รายงาน connectivity ของ app-server, account, rate limits, MCP
servers และ skills `/codex models` แสดง catalog สดของ Codex app-server สำหรับ
harness และ account หาก `/status` ไม่เป็นไปตามที่คาด โปรดดู
[การแก้ไขปัญหา](#troubleshooting)

## การ route และการเลือก model

แยก provider refs และ runtime policy ออกจากกัน:

- ใช้ `openai/gpt-*` สำหรับ turn ของ OpenAI agent ผ่าน Codex
- อย่าใช้ `openai-codex/gpt-*` ใน config รัน `openclaw doctor --fix` เพื่อ
  ซ่อม refs รุ่นเก่าและ route pins ของ session ที่ค้างอยู่
- `agentRuntime.id: "codex"` เป็นตัวเลือกสำหรับโหมด OpenAI auto ปกติ แต่มีประโยชน์
  เมื่อ deployment ควร fail closed หาก Codex ไม่พร้อมใช้งาน
- `agentRuntime.id: "pi"` ให้ provider หรือ model เข้าใช้พฤติกรรม PI โดยตรงเมื่อ
  เป็นความตั้งใจ
- `/codex ...` ควบคุมการสนทนา Codex app-server แบบ native จากแชต
- ACP/acpx เป็นเส้นทาง harness ภายนอกอีกแบบหนึ่ง ใช้เฉพาะเมื่อผู้ใช้ขอ
  ACP/acpx หรือ adapter สำหรับ harness ภายนอก

การ route คำสั่งทั่วไป:

| ความตั้งใจของผู้ใช้                     | ใช้                                     |
| ------------------------------- | --------------------------------------- |
| แนบแชตปัจจุบัน         | `/codex bind [--cwd <path>]`            |
| resume thread ของ Codex ที่มีอยู่ | `/codex resume <thread-id>`             |
| แสดงรายการหรือ filter threads ของ Codex    | `/codex threads [filter]`               |
| ส่ง feedback ของ Codex เท่านั้น        | `/codex diagnostics [note]`             |
| เริ่ม task ACP/acpx          | คำสั่ง session ของ ACP/acpx ไม่ใช่ `/codex` |

| กรณีใช้งาน                                             | กำหนดค่า                                                        | ตรวจสอบ                                  | หมายเหตุ                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| subscription ของ ChatGPT/Codex พร้อม Codex runtime แบบ native | `openai/gpt-*` บวก Plugin `codex` ที่เปิดใช้แล้ว                       | `/status` แสดง `Runtime: OpenAI Codex` | เส้นทางที่แนะนำ                   |
| fail closed หาก Codex ไม่พร้อมใช้งาน                  | Provider หรือ model `agentRuntime.id: "codex"`                     | turn ล้มเหลวแทน PI fallback       | ใช้สำหรับ deployment ที่ใช้ Codex เท่านั้น     |
| traffic ของ OpenAI API-key โดยตรงผ่าน PI             | Provider หรือ model `agentRuntime.id: "pi"` และ OpenAI auth ปกติ | `/status` แสดง PI runtime              | ใช้เฉพาะเมื่อ PI เป็นความตั้งใจ    |
| config รุ่นเก่า                                        | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` เขียนใหม่     | อย่าเขียน config ใหม่ด้วยวิธีนี้   |
| adapter Codex ของ ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                         | สถานะ ACP task/session                 | แยกจาก Codex harness แบบ native |

`agents.defaults.imageModel` ใช้การแยก prefix แบบเดียวกัน ใช้ `openai/gpt-*`
สำหรับ route ของ OpenAI ปกติ และ `codex/gpt-*` เฉพาะเมื่อ image understanding
ควรรันผ่าน turn ของ Codex app-server ที่มีขอบเขต อย่าใช้
`openai-codex/gpt-*`; doctor จะเขียน prefix รุ่นเก่านั้นใหม่เป็น `openai/gpt-*`

## รูปแบบ deployment

### deployment Codex พื้นฐาน

ใช้ config ใน quickstart เมื่อ turn ทั้งหมดของ OpenAI agent ควรใช้ Codex ตาม
ค่าเริ่มต้น

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### deployment แบบ provider ผสม

รูปแบบนี้คง Claude เป็น agent เริ่มต้นและเพิ่ม agent Codex แบบมีชื่อ:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

ด้วย config นี้ agent `main` ใช้เส้นทาง provider ปกติของตน และ
agent `codex` ใช้ Codex app-server

### deployment Codex แบบ fail-closed

สำหรับ turn ของ OpenAI agent, `openai/gpt-*` จะ resolve ไปยัง Codex อยู่แล้วเมื่อ
Plugin ที่รวมมาพร้อมพร้อมใช้งาน เพิ่ม runtime policy ที่ชัดเจนเมื่อคุณต้องการกฎ
fail-closed ที่เขียนไว้:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Codex Plugin ถูกปิดใช้,
app-server เก่าเกินไป หรือ app-server เริ่มไม่ได้

## นโยบาย app-server

ตามค่าเริ่มต้น Plugin จะเริ่ม binary ของ Codex ที่ OpenClaw จัดการภายในเครื่องด้วย stdio
transport ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจรัน executable
อื่น ใช้ WebSocket transport เฉพาะเมื่อมี app-server รันอยู่ที่อื่นแล้ว:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

เซสชัน app-server แบบ stdio ภายในเครื่องมีค่าเริ่มต้นเป็นท่าทีของผู้ปฏิบัติการภายในเครื่องที่เชื่อถือได้:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` หากข้อกำหนด Codex ภายในเครื่องไม่อนุญาตท่าที YOLO
โดยนัยนั้น OpenClaw จะเลือกสิทธิ์ guardian ที่อนุญาตแทน
เมื่อแซนด์บ็อกซ์ของ OpenClaw ทำงานอยู่สำหรับเซสชัน OpenClaw จะจำกัด Codex
`danger-full-access` ให้เป็น Codex `workspace-write` เพื่อให้รอบโหมดโค้ด Codex
แบบเนทีฟยังอยู่ภายในพื้นที่ทำงานที่ถูกแซนด์บ็อกซ์ไว้

ใช้โหมด guardian เมื่อคุณต้องการให้ Codex ตรวจทานอัตโนมัติแบบเนทีฟก่อนออกจากแซนด์บ็อกซ์
หรือขอสิทธิ์เพิ่มเติม:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

โหมด guardian จะขยายเป็นการอนุมัติ app-server ของ Codex โดยปกติคือ
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` และ
`sandbox: "workspace-write"` เมื่อข้อกำหนดภายในเครื่องอนุญาตค่าเหล่านั้น

สำหรับทุกฟิลด์ app-server ลำดับการยืนยันตัวตน การแยกสภาพแวดล้อม การค้นพบ และ
พฤติกรรมหมดเวลา โปรดดู [ข้อมูลอ้างอิงชุดทดสอบ Codex](/th/plugins/codex-harness-reference)

## คำสั่งและการวินิจฉัย

Plugin ที่มาพร้อมกันลงทะเบียน `/codex` เป็นคำสั่ง slash บนช่องทางใดก็ตามที่
รองรับคำสั่งข้อความของ OpenClaw

รูปแบบทั่วไป:

- `/codex status` ตรวจสอบการเชื่อมต่อ app-server, โมเดล, บัญชี, ขีดจำกัดอัตรา,
  เซิร์ฟเวอร์ MCP และ Skills
- `/codex models` แสดงรายการโมเดล app-server ของ Codex แบบสด
- `/codex threads [filter]` แสดงรายการเธรด app-server ของ Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับ
  เธรด Codex ที่มีอยู่
- `/codex compact` ขอให้ app-server ของ Codex ทำ Compaction เธรดที่แนบอยู่
- `/codex review` เริ่มการตรวจทานแบบเนทีฟของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` ถามก่อนส่งคำติชม Codex สำหรับ
  เธรดที่แนบอยู่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตรา
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของ app-server ของ Codex
- `/codex skills` แสดงรายการ Skills ของ app-server ของ Codex

สำหรับรายงานสนับสนุนส่วนใหญ่ ให้เริ่มด้วย `/diagnostics [note]` ในบทสนทนา
ที่เกิดบั๊ก คำสั่งนี้จะสร้างรายงานการวินิจฉัย Gateway หนึ่งรายการ และสำหรับเซสชัน
ชุดทดสอบ Codex จะขออนุมัติเพื่อส่งชุดคำติชม Codex ที่เกี่ยวข้อง
ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรม
แชตกลุ่ม

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดคำติชม Codex
สำหรับเธรดที่แนบอยู่ในขณะนี้โดยเฉพาะ โดยไม่มีชุดการวินิจฉัย Gateway เต็มรูปแบบ

### ตรวจสอบเธรด Codex ภายในเครื่อง

วิธีที่เร็วที่สุดในการตรวจสอบการรัน Codex ที่ผิดพลาดมักคือเปิดเธรด Codex
แบบเนทีฟโดยตรง:

```bash
codex resume <thread-id>
```

รับรหัสเธรดจากคำตอบ `/diagnostics` ที่เสร็จแล้ว, `/codex binding` หรือ
`/codex threads [filter]`

สำหรับกลไกการอัปโหลดและขอบเขตการวินิจฉัยระดับรันไทม์ โปรดดู
[รันไทม์ชุดทดสอบ Codex](/th/plugins/codex-harness-runtime#codex-feedback-upload)

การยืนยันตัวตนจะถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenAI ที่จัดลำดับไว้สำหรับเอเจนต์ โดยควรอยู่ภายใต้
   `auth.order.openai` รหัสโปรไฟล์ `openai-codex:*` ที่มีอยู่ยังคงใช้ได้
2. บัญชีที่มีอยู่ของ app-server ในบ้าน Codex ของเอเจนต์นั้น
3. สำหรับการเปิด app-server แบบ stdio ภายในเครื่องเท่านั้น `CODEX_API_KEY` จากนั้น
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server และยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์การยืนยันตัวตน Codex แบบการสมัครใช้งาน ChatGPT ระบบจะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ถูกสร้างขึ้น วิธีนี้ช่วยให้
คีย์ API ระดับ Gateway ยังคงพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้รอบ app-server ของ Codex แบบเนทีฟถูกคิดค่าบริการผ่าน API โดยไม่ตั้งใจ
โปรไฟล์คีย์ API Codex แบบชัดเจนและตัวสำรองคีย์ env แบบ stdio ภายในเครื่องใช้การเข้าสู่ระบบ app-server
แทนการสืบทอด env ของกระบวนการลูก การเชื่อมต่อ app-server แบบ WebSocket
จะไม่ได้รับตัวสำรองคีย์ API จาก env ของ Gateway ให้ใช้โปรไฟล์การยืนยันตัวตนแบบชัดเจนหรือบัญชีของ
app-server ระยะไกลเอง

หากโปรไฟล์การสมัครใช้งานชนขีดจำกัดการใช้งาน Codex OpenClaw จะบันทึกเวลารีเซ็ต
เมื่อ Codex รายงานมา และลองโปรไฟล์การยืนยันตัวตนถัดไปตามลำดับสำหรับการรัน Codex เดียวกัน
เมื่อเวลารีเซ็ตผ่านไป โปรไฟล์การสมัครใช้งานจะกลับมาใช้ได้อีกครั้งโดยไม่เปลี่ยน
โมเดล `openai/gpt-*` หรือรันไทม์ Codex ที่เลือกไว้

หากการปรับใช้ต้องการการแยกสภาพแวดล้อมเพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นใน
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูก app-server ของ Codex ที่ถูกสร้างขึ้นเท่านั้น

เครื่องมือไดนามิกของ Codex มีค่าเริ่มต้นเป็นการโหลดแบบ `searchable` OpenClaw ไม่เปิดเผย
เครื่องมือไดนามิกที่ซ้ำกับการดำเนินการในพื้นที่ทำงานแบบเนทีฟของ Codex ได้แก่ `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` และ `update_plan` เครื่องมือผสานรวม OpenClaw
ที่เหลือ เช่น การส่งข้อความ, เซสชัน, สื่อ, cron, เบราว์เซอร์, โหนด,
gateway, `heartbeat_respond` และ `web_search` พร้อมใช้งานผ่านการค้นหาเครื่องมือของ Codex
ภายใต้เนมสเปซ `openclaw` ซึ่งทำให้บริบทโมเดลเริ่มต้นเล็กลง
`sessions_yield` และการตอบกลับต้นทางที่ใช้เฉพาะเครื่องมือข้อความยังคงเป็นแบบตรง เพราะสิ่งเหล่านี้
เป็นสัญญาควบคุมรอบ คำสั่งการทำงานร่วมกันของ Heartbeat บอกให้ Codex
ค้นหา `heartbeat_respond` ก่อนจบรอบ Heartbeat เมื่อเครื่องมือยังไม่ได้โหลด

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับ app-server ของ Codex แบบกำหนดเอง
ที่ไม่สามารถค้นหาเครื่องมือไดนามิกที่เลื่อนไว้ หรือเมื่อดีบัก payload เครื่องมือเต็มรูปแบบ

ฟิลด์ Plugin Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น        | ความหมาย                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | ใช้ `"direct"` เพื่อวางเครื่องมือไดนามิกของ OpenClaw โดยตรงในบริบทเครื่องมือ Codex เริ่มต้น |
| `codexDynamicToolsExclude` | `[]`           | ชื่อเครื่องมือไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากรอบ app-server ของ Codex              |
| `codexPlugins`             | ปิดใช้งาน       | การรองรับ Plugin/แอป Codex แบบเนทีฟสำหรับ Plugin ที่คัดสรรซึ่งติดตั้งจากซอร์สและย้ายข้อมูลแล้ว           |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` สร้าง Codex; `"websocket"` เชื่อมต่อกับ `url`                                                                                                                                                                                |
| `command`                     | ไบนารี Codex ที่จัดการไว้                                   | ไฟล์ปฏิบัติการสำหรับ transport แบบ stdio เว้นว่างไว้เพื่อใช้ไบนารีที่จัดการไว้ ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับ transport แบบ stdio                                                                                                                                                                                                          |
| `url`                         | ไม่ได้ตั้งค่า                                                  | URL ของ app-server แบบ WebSocket                                                                                                                                                                                                               |
| `authToken`                   | ไม่ได้ตั้งค่า                                                  | โทเค็น Bearer สำหรับ transport แบบ WebSocket                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | ส่วนหัว WebSocket เพิ่มเติม                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากกระบวนการ app-server แบบ stdio ที่สร้างขึ้น หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex ต่อเอเจนต์ของ OpenClaw ในการเปิดภายในเครื่อง    |
| `requestTimeoutMs`            | `60000`                                                | เวลาหมดอายุสำหรับการเรียกระนาบควบคุมของ app-server                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | หน้าต่างเงียบหลังคำขอ app-server ของ Codex ที่จำกัดขอบเขตรอบ ขณะที่ OpenClaw รอ `turn/completed` เพิ่มค่านี้สำหรับเฟสสังเคราะห์หลังเครื่องมือหรือเฉพาะสถานะที่ช้า                                                                     |
| `mode`                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ภายในเครื่องไม่อนุญาต YOLO | ค่าที่ตั้งไว้ล่วงหน้าสำหรับการดำเนินการแบบ YOLO หรือที่ผ่านการตรวจทานโดย guardian ข้อกำหนด stdio ภายในเครื่องที่ละเว้น `danger-full-access`, การอนุมัติ `never` หรือผู้ตรวจทาน `user` จะทำให้ค่าเริ่มต้นโดยนัยเป็น guardian                                                   |
| `approvalPolicy`              | `"never"` หรือนโยบายการอนุมัติ guardian ที่อนุญาต       | นโยบายการอนุมัติ Codex แบบเนทีฟที่ส่งไปยังการเริ่ม/กลับมาทำต่อ/รอบของเธรด ค่าเริ่มต้นของ guardian จะเลือก `"on-request"` เมื่ออนุญาต                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` หรือแซนด์บ็อกซ์ guardian ที่อนุญาต  | โหมดแซนด์บ็อกซ์ Codex แบบเนทีฟที่ส่งไปยังการเริ่ม/กลับมาทำต่อของเธรด ค่าเริ่มต้นของ guardian จะเลือก `"workspace-write"` เมื่ออนุญาต มิฉะนั้นเลือก `"read-only"` เมื่อแซนด์บ็อกซ์ OpenClaw ทำงานอยู่ `danger-full-access` จะถูกจำกัดเป็น `"workspace-write"` |
| `approvalsReviewer`           | `"user"` หรือผู้ตรวจทาน guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทานพรอมป์การอนุมัติแบบเนทีฟเมื่ออนุญาต มิฉะนั้นใช้ `guardian_subagent` หรือ `user` `guardian_subagent` ยังคงเป็น alias รุ่นเก่า                                                                      |
| `serviceTier`                 | ไม่ได้ตั้งค่า                                                  | ระดับบริการ app-server ของ Codex ที่เลือกได้ `"priority"` เปิดใช้การกำหนดเส้นทางโหมดเร็ว, `"flex"` ขอการประมวลผลแบบ flex, `null` ล้าง override และ `"fast"` แบบเดิมได้รับการยอมรับเป็น `"priority"`                                         |

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` ใช้ watchdog ของ
OpenClaw ค่าเริ่มต้น 30 วินาที อาร์กิวเมนต์ `timeoutMs` ต่อการเรียกที่เป็นค่าบวกจะขยาย
หรือย่นงบเวลาของเครื่องมือนั้นโดยเฉพาะ เครื่องมือ `image_generate` ยังใช้
`agents.defaults.imageGenerationModel.timeoutMs` เมื่อการเรียกเครื่องมือไม่ได้
กำหนด timeout ของตัวเอง และเครื่องมือ `image` สำหรับการทำความเข้าใจสื่อใช้
`tools.media.image.timeoutSeconds` หรือค่าเริ่มต้นสำหรับสื่อ 60 วินาที งบเวลาเครื่องมือแบบไดนามิก
ถูกจำกัดสูงสุดที่ 600000 ms เมื่อ timeout, OpenClaw จะยกเลิกสัญญาณเครื่องมือ
เมื่อรองรับ และส่งคืนการตอบกลับ dynamic-tool ที่ล้มเหลวให้ Codex เพื่อให้ turn
ดำเนินต่อได้แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server ที่จำกัดขอบเขตตาม turn ของ Codex แล้ว harness
ยังคาดหวังให้ Codex จบ native turn ด้วย `turn/completed` ด้วย หาก
app-server เงียบไปเป็นเวลา `appServer.turnCompletionIdleTimeoutMs` หลังจาก
การตอบกลับนั้น OpenClaw จะพยายามขัดจังหวะ turn ของ Codex อย่างดีที่สุด บันทึก timeout
เพื่อการวินิจฉัย และปล่อย lane ของเซสชัน OpenClaw เพื่อไม่ให้ข้อความแชตถัดไป
ถูกคิวไว้หลัง native turn ที่ค้างเก่า การแจ้งเตือนที่ไม่ใช่สถานะปลายทางใดๆ สำหรับ
turn เดียวกัน รวมถึง `rawResponseItem/completed` จะปลด watchdog สั้นนั้น
เพราะ Codex พิสูจน์แล้วว่า turn ยังทำงานอยู่; watchdog ปลายทางที่นานกว่าจะยังคง
ป้องกัน turn ที่ค้างจริงๆ การวินิจฉัย timeout รวมเมธอดการแจ้งเตือน app-server
ล่าสุด และสำหรับรายการ raw assistant response จะรวมประเภท item, role, id,
และตัวอย่างข้อความ assistant แบบจำกัดขนาด

การ override ด้วยสภาพแวดล้อมยังคงมีให้ใช้สำหรับการทดสอบภายในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่จัดการไว้เมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกนำออกแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบภายในเครื่องแบบครั้งเดียว แนะนำให้ใช้ config
สำหรับการ deploy ที่ทำซ้ำได้ เพราะช่วยเก็บพฤติกรรม Plugin ไว้ใน
ไฟล์ที่ผ่านการตรวจทานเดียวกับส่วนที่เหลือของการตั้งค่า Codex harness

## Native Codex plugins

การรองรับ native Codex plugin ใช้ความสามารถ app และ plugin ของ Codex app-server เอง
ใน thread Codex เดียวกับ turn ของ OpenClaw harness OpenClaw
ไม่ได้แปล Codex plugins เป็นเครื่องมือแบบไดนามิก `codex_plugin_*` ของ OpenClaw
ที่สร้างขึ้น

`codexPlugins` มีผลเฉพาะกับเซสชันที่เลือก native Codex harness เท่านั้น
ไม่มีผลกับการรัน PI, การรัน provider OpenAI ปกติ, การผูกการสนทนา
ACP หรือ harness อื่นๆ

config ที่ migrate แล้วแบบขั้นต่ำ:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Thread app config ถูกคำนวณเมื่อ OpenClaw สร้างเซสชัน Codex harness
หรือแทนที่การผูก Codex thread ที่ค้างเก่า โดยจะไม่ถูกคำนวณใหม่ในทุก turn
หลังจากเปลี่ยน `codexPlugins` ให้ใช้ `/new`, `/reset` หรือรีสตาร์ท gateway เพื่อให้
เซสชัน Codex harness ในอนาคตเริ่มต้นด้วยชุด app ที่อัปเดตแล้ว

สำหรับคุณสมบัติการ migrate, inventory ของ app, นโยบายการกระทำแบบทำลาย,
elicitations และการวินิจฉัย native plugin โปรดดู
[Native Codex plugins](/th/plugins/codex-native-plugins)

## Computer Use

Computer Use ครอบคลุมอยู่ในคู่มือการตั้งค่าของตัวเอง:
[Codex Computer Use](/th/plugins/codex-computer-use).

สรุปแบบสั้น: OpenClaw ไม่ vendor app ควบคุมเดสก์ท็อปหรือดำเนินการ
desktop actions ด้วยตัวเอง แต่เตรียม Codex app-server, ตรวจสอบว่า
MCP server `computer-use` พร้อมใช้งาน แล้วปล่อยให้ Codex เป็นเจ้าของการเรียกเครื่องมือ MCP
แบบ native ระหว่าง turn ใน Codex-mode

## ขอบเขต Runtime

Codex harness เปลี่ยนเฉพาะ embedded agent executor ระดับล่างเท่านั้น

- รองรับเครื่องมือแบบไดนามิกของ OpenClaw Codex ขอให้ OpenClaw ดำเนินการ
  เครื่องมือเหล่านั้น ดังนั้น OpenClaw ยังคงอยู่ในเส้นทางการดำเนินการ
- เครื่องมือ shell, patch, MCP และ native app แบบ Codex-native เป็นของ Codex
  OpenClaw สามารถสังเกตหรือบล็อก native events ที่เลือกผ่าน relay ที่รองรับ
  แต่จะไม่เขียนอาร์กิวเมนต์ของเครื่องมือ native ใหม่
- Codex เป็นเจ้าของ native compaction OpenClaw เก็บสำเนา transcript สำหรับประวัติ channel,
  search, `/new`, `/reset` และการสลับ model หรือ harness ในอนาคต
- การสร้างสื่อ, การทำความเข้าใจสื่อ, TTS, approvals และ output ของ messaging-tool
  ยังคงผ่านการตั้งค่า provider/model ของ OpenClaw ที่ตรงกัน
- `tool_result_persist` ใช้กับผลลัพธ์เครื่องมือ transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่
  ระเบียนผลลัพธ์เครื่องมือ Codex-native

สำหรับชั้น hook, พื้นผิว V1 ที่รองรับ, การจัดการสิทธิ์แบบ native, queue
steering, กลไกอัปโหลด feedback ของ Codex และรายละเอียด Compaction โปรดดู
[Codex harness runtime](/th/plugins/codex-harness-runtime).

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็น provider `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ
config ใหม่ เลือก model `openai/gpt-*`, เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` exclude
`codex` หรือไม่

**OpenClaw ใช้ PI แทน Codex:** ตรวจสอบให้แน่ใจว่า model ref เป็น
`openai/gpt-*` บน provider OpenAI อย่างเป็นทางการ และ Codex plugin ถูกติดตั้ง
และเปิดใช้งานแล้ว หากต้องการหลักฐานที่เข้มงวดระหว่างทดสอบ ให้ตั้ง provider หรือ
model `agentRuntime.id: "codex"` Runtime Codex ที่บังคับไว้จะล้มเหลวแทนที่จะ
fallback ไป PI

**ยังมี config `openai-codex/*` แบบ legacy:** รัน `openclaw doctor --fix`.
Doctor จะเขียน model refs แบบ legacy เป็น `openai/*` ใหม่ ลบ session และ
runtime pins ระดับ whole-agent ที่ค้างเก่า และรักษา auth-profile overrides ที่มีอยู่

**app-server ถูกปฏิเสธ:** ใช้ Codex app-server `0.125.0` หรือใหม่กว่า
prereleases เวอร์ชันเดียวกันหรือเวอร์ชันที่มี build suffix เช่น
`0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ OpenClaw ทดสอบ
stable protocol floor `0.125.0`

**`/codex status` เชื่อมต่อไม่ได้:** ตรวจสอบว่า Plugin `codex` ที่ bundled มา
เปิดใช้งานอยู่, `plugins.allow` รวมไว้เมื่อมีการกำหนด allowlist และ
`appServer.command`, `url`, `authToken` หรือ headers แบบกำหนดเองถูกต้อง

**การค้นพบ model ช้า:** ลด
`plugins.entries.codex.config.discovery.timeoutMs` หรือปิดใช้ discovery ดู
[Codex harness reference](/th/plugins/codex-harness-reference#model-discovery).

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`,
headers และตรวจสอบว่า app-server ระยะไกลพูด protocol version ของ Codex app-server เดียวกัน

**model ที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่นโยบาย runtime ของ provider หรือ model
จะ route ไปยัง harness อื่น provider refs ที่ไม่ใช่ OpenAI แบบธรรมดาจะคงอยู่บน
เส้นทาง provider ปกติของตัวเองในโหมด `auto`

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงาน
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ท
gateway เพื่อล้างการลงทะเบียน native hook ที่ค้างเก่า ดู
[Codex Computer Use](/th/plugins/codex-computer-use#troubleshooting).

## ที่เกี่ยวข้อง

- [Codex harness reference](/th/plugins/codex-harness-reference)
- [Codex harness runtime](/th/plugins/codex-harness-runtime)
- [Native Codex plugins](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [Agent runtimes](/th/concepts/agent-runtimes)
- [Model providers](/th/concepts/model-providers)
- [OpenAI provider](/th/providers/openai)
- [Agent harness plugins](/th/plugins/sdk-agent-harness)
- [Plugin hooks](/th/plugins/hooks)
- [Diagnostics export](/th/gateway/diagnostics)
- [Status](/th/cli/status)
- [Testing](/th/help/testing-live#live-codex-app-server-harness-smoke)
