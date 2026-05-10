---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่มาพร้อมในชุด
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนสของ Codex
    - คุณต้องการให้การปรับใช้แบบ Codex-only ล้มเหลวแทนที่จะย้อนกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาให้
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-05-10T19:46:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่รวมมาให้ช่วยให้ OpenClaw เรียกใช้รอบการทำงานของ OpenAI agent แบบฝังตัว
ผ่าน Codex app-server แทน PI harness ในตัว

ใช้ Codex harness เมื่อต้องการให้ Codex เป็นเจ้าของ session ของ agent ระดับต่ำ:
การ resume thread แบบเนทีฟ, การทำต่อของ tool แบบเนทีฟ, compaction แบบเนทีฟ และ
การดำเนินการผ่าน app-server OpenClaw ยังคงเป็นเจ้าของ chat channels, session files, การเลือก model,
OpenClaw dynamic tools, approvals, การส่ง media และ transcript mirror ที่มองเห็นได้

การตั้งค่าปกติใช้ canonical OpenAI model refs เช่น `openai/gpt-5.5`
อย่ากำหนดค่า `openai-codex/gpt-*` model refs `openai-codex` คือ auth
profile provider สำหรับ Codex OAuth หรือ Codex API-key profiles ไม่ใช่ model
provider prefix สำหรับ agent config ใหม่

สำหรับการแยก model/provider/runtime โดยรวม ให้เริ่มที่
[Agent runtimes](/th/concepts/agent-runtimes) เวอร์ชันสั้นคือ:
`openai/gpt-5.5` คือ model ref, `codex` คือ runtime และ Telegram,
Discord, Slack หรือ channel อื่นยังคงเป็นพื้นผิวการสื่อสาร

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` ที่รวมมาให้
- หาก config ของคุณใช้ `plugins.allow` ให้รวม `codex`
- Codex app-server `0.125.0` หรือใหม่กว่า โดยค่าเริ่มต้น Plugin ที่รวมมาให้จะจัดการ
  binary ของ Codex app-server ที่เข้ากันได้ ดังนั้นคำสั่ง `codex` ภายในเครื่องบน `PATH` จะไม่
  ส่งผลต่อการเริ่มต้น harness ปกติ
- Codex auth ที่พร้อมใช้งานผ่าน `openclaw models auth login --provider openai-codex`,
  บัญชี app-server ใน Codex home ของ agent หรือ Codex API-key
  auth profile ที่ระบุชัดเจน

สำหรับลำดับความสำคัญของ auth, การแยก environment, คำสั่ง app-server แบบกำหนดเอง, การค้นหา model,
และ config fields ทั้งหมด โปรดดู
[Codex harness reference](/th/plugins/codex-harness-reference)

## เริ่มต้นอย่างรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ Codex ใน OpenClaw ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
ChatGPT/Codex subscription, เปิดใช้ Plugin `codex` ที่รวมมาให้ และใช้
canonical `openai/gpt-*` model ref

ลงชื่อเข้าใช้ด้วย Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

เปิดใช้ Plugin `codex` ที่รวมมาให้และเลือก OpenAI agent model:

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

หาก config ของคุณใช้ `plugins.allow` ให้เพิ่ม `codex` ไว้ที่นั่นด้วย:

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

รีสตาร์ท Gateway หลังจากเปลี่ยน Plugin config หาก chat ที่มีอยู่มี
session อยู่แล้ว ให้ใช้ `/new` หรือ `/reset` ก่อนทดสอบ runtime changes เพื่อให้รอบถัดไป
resolve harness จาก config ปัจจุบัน

## การกำหนดค่า

quickstart config คือ Codex harness config ขั้นต่ำที่ใช้งานได้ ตั้งค่า Codex
harness options ใน OpenClaw config และใช้ CLI สำหรับ Codex auth เท่านั้น:

| ความต้องการ                                   | ตั้งค่า                                                                | ที่ใด                          |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| เปิดใช้ harness                     | `plugins.entries.codex.enabled: true`                              | OpenClaw config                |
| คงการติดตั้ง Plugin แบบ allowlisted     | รวม `codex` ใน `plugins.allow`                                 | OpenClaw config                |
| ส่งรอบการทำงาน OpenAI agent ผ่าน Codex | `agents.defaults.model` หรือ `agents.list[].model` เป็น `openai/gpt-*` | OpenClaw agent config          |
| ลงชื่อเข้าใช้ด้วย Codex OAuth               | `openclaw models auth login --provider openai-codex`               | CLI auth profile               |
| ล้มเหลวแบบปิดเมื่อ Codex ไม่พร้อมใช้งาน  | Provider หรือ model `agentRuntime.id: "codex"`                       | OpenClaw model/provider config |
| ใช้การรับส่ง OpenAI API โดยตรง          | Provider หรือ model `agentRuntime.id: "pi"` พร้อม OpenAI auth ปกติ  | OpenClaw model/provider config |
| ปรับแต่งพฤติกรรม app-server               | `plugins.entries.codex.config.appServer.*`                         | Codex Plugin config            |
| เปิดใช้แอป Plugin ของ Codex แบบเนทีฟ        | `plugins.entries.codex.config.codexPlugins.*`                      | Codex Plugin config            |
| เปิดใช้ Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                       | Codex Plugin config            |

ใช้ `openai/gpt-*` model refs สำหรับรอบการทำงาน OpenAI agent ที่รองรับด้วย Codex
`openai-codex` เป็นเพียงชื่อ auth-profile provider สำหรับ Codex OAuth และ
Codex API-key profiles อย่าเขียน `openai-codex/gpt-*` model refs ใหม่

ส่วนที่เหลือของหน้านี้ครอบคลุมตัวเลือกทั่วไปที่ผู้ใช้ต้องเลือกระหว่าง:
รูปแบบ deployment, การ route แบบ fail-closed, guardian approval policy, Codex
plugins แบบเนทีฟ และ Computer Use สำหรับรายการ option ทั้งหมด, defaults, enums, discovery,
environment isolation, timeouts และ app-server transport fields โปรดดู
[Codex harness reference](/th/plugins/codex-harness-reference)

## ตรวจสอบ Codex runtime

ใช้ `/status` ใน chat ที่คุณคาดว่าจะใช้ Codex รอบการทำงาน OpenAI agent ที่รองรับด้วย Codex
จะแสดง:

```text
Runtime: OpenAI Codex
```

จากนั้นตรวจสอบสถานะ Codex app-server:

```text
/codex status
/codex models
```

`/codex status` รายงานการเชื่อมต่อ app-server, account, rate limits, MCP
servers และ skills `/codex models` แสดงรายการ catalog ของ Codex app-server แบบ live สำหรับ
harness และ account หาก `/status` น่าประหลาดใจ โปรดดู
[Troubleshooting](#troubleshooting)

## Routing และการเลือก model

แยก provider refs และ runtime policy ออกจากกัน:

- ใช้ `openai/gpt-*` สำหรับรอบการทำงาน OpenAI agent ผ่าน Codex
- อย่าใช้ `openai-codex/gpt-*` ใน config เรียกใช้ `openclaw doctor --fix` เพื่อ
  ซ่อม legacy refs และ stale session route pins
- `agentRuntime.id: "codex"` เป็น optional สำหรับ OpenAI auto mode ปกติ แต่มีประโยชน์
  เมื่อ deployment ควรล้มเหลวแบบปิดหาก Codex ไม่พร้อมใช้งาน
- `agentRuntime.id: "pi"` เลือกให้ provider หรือ model ใช้พฤติกรรม PI โดยตรงเมื่อ
  ตั้งใจให้เป็นเช่นนั้น
- `/codex ...` ควบคุมการสนทนา Codex app-server แบบเนทีฟจาก chat
- ACP/acpx เป็นเส้นทาง external harness แยกต่างหาก ใช้เฉพาะเมื่อผู้ใช้ขอ
  ACP/acpx หรือ external harness adapter

การ route คำสั่งทั่วไป:

| เจตนาของผู้ใช้                     | ใช้                                     |
| ------------------------------- | --------------------------------------- |
| แนบ chat ปัจจุบัน         | `/codex bind [--cwd <path>]`            |
| Resume thread Codex ที่มีอยู่ | `/codex resume <thread-id>`             |
| แสดงรายการหรือกรอง Codex threads    | `/codex threads [filter]`               |
| ส่ง Codex feedback เท่านั้น        | `/codex diagnostics [note]`             |
| เริ่ม ACP/acpx task          | คำสั่ง ACP/acpx session ไม่ใช่ `/codex` |

| กรณีใช้งาน                                             | กำหนดค่า                                                        | ตรวจสอบ                                  | หมายเหตุ                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ChatGPT/Codex subscription พร้อม runtime Codex แบบเนทีฟ | `openai/gpt-*` รวมกับ Plugin `codex` ที่เปิดใช้แล้ว                       | `/status` แสดง `Runtime: OpenAI Codex` | เส้นทางที่แนะนำ                   |
| ล้มเหลวแบบปิดหาก Codex ไม่พร้อมใช้งาน                  | Provider หรือ model `agentRuntime.id: "codex"`                     | รอบการทำงานล้มเหลวแทน PI fallback       | ใช้สำหรับ Codex-only deployments     |
| การรับส่ง OpenAI API-key โดยตรงผ่าน PI             | Provider หรือ model `agentRuntime.id: "pi"` และ OpenAI auth ปกติ | `/status` แสดง PI runtime              | ใช้เฉพาะเมื่อ PI เป็นสิ่งที่ตั้งใจ    |
| Legacy config                                        | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` เขียนใหม่ให้     | อย่าเขียน config ใหม่ด้วยวิธีนี้   |
| ACP/acpx Codex adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                         | สถานะ ACP task/session                 | แยกจาก Codex harness แบบเนทีฟ |

`agents.defaults.imageModel` ทำตามการแยก prefix เดียวกัน ใช้ `openai/gpt-*`
สำหรับ OpenAI route ปกติ และใช้ `codex/gpt-*` เฉพาะเมื่อ image understanding
ควรทำงานผ่านรอบ Codex app-server ที่มีขอบเขต อย่าใช้
`openai-codex/gpt-*`; doctor จะเขียน legacy prefix นั้นใหม่เป็น `openai/gpt-*`

## รูปแบบ Deployment

### Basic Codex deployment

ใช้ quickstart config เมื่อรอบการทำงาน OpenAI agent ทั้งหมดควรใช้ Codex เป็น
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

### Mixed provider deployment

รูปแบบนี้คง Claude เป็น agent เริ่มต้นและเพิ่ม agent Codex ที่มีชื่อ:

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

ด้วย config นี้ agent `main` ใช้เส้นทาง provider ปกติของมัน และ agent
`codex` ใช้ Codex app-server

### Fail-closed Codex deployment

สำหรับรอบการทำงาน OpenAI agent, `openai/gpt-*` จะ resolve เป็น Codex อยู่แล้วเมื่อ
Plugin ที่รวมมาให้พร้อมใช้งาน เพิ่ม runtime policy ที่ระบุชัดเจนเมื่อคุณต้องการกฎ
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

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Plugin Codex ถูกปิดใช้งาน,
app-server เก่าเกินไป หรือ app-server เริ่มต้นไม่ได้

## App-server policy

โดยค่าเริ่มต้น Plugin จะเริ่ม binary Codex ที่ OpenClaw จัดการภายในเครื่องด้วย stdio
transport ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจจะเรียกใช้
executable อื่น ใช้ WebSocket transport เฉพาะเมื่อ app-server กำลัง
ทำงานอยู่ที่อื่นแล้ว:

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

local stdio app-server sessions มีค่าเริ่มต้นเป็นท่าทีของผู้ปฏิบัติงานภายในที่เชื่อถือได้:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` หากข้อกำหนด Codex ภายในเครื่องไม่อนุญาตท่าที
YOLO โดยนัยนั้น OpenClaw จะเลือก guardian permissions ที่อนุญาตแทน

ใช้ guardian mode เมื่อคุณต้องการ Codex native auto-review ก่อน sandbox escapes
หรือสิทธิ์เพิ่มเติม:

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

Guardian mode จะขยายเป็น Codex app-server approvals โดยทั่วไปคือ
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` และ
`sandbox: "workspace-write"` เมื่อข้อกำหนดภายในเครื่องอนุญาตค่าเหล่านั้น

สำหรับ app-server field ทุกตัว, ลำดับ auth, environment isolation, discovery และ
timeout behavior โปรดดู [Codex harness reference](/th/plugins/codex-harness-reference)

## คำสั่งและ diagnostics

Plugin ที่รวมมาให้ลงทะเบียน `/codex` เป็น slash command บน channel ใดก็ได้ที่
รองรับ OpenClaw text commands

รูปแบบทั่วไป:

- `/codex status` ตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์แอป, โมเดล, บัญชี, ขีดจำกัดอัตรา,
  เซิร์ฟเวอร์ MCP และ skills
- `/codex models` แสดงรายการโมเดลเซิร์ฟเวอร์แอป Codex แบบสด
- `/codex threads [filter]` แสดงรายการเธรดเซิร์ฟเวอร์แอป Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับ
  เธรด Codex ที่มีอยู่
- `/codex compact` ขอให้เซิร์ฟเวอร์แอป Codex ทำ Compaction ให้เธรดที่แนบอยู่
- `/codex review` เริ่มการรีวิวแบบเนทีฟของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` ขออนุมัติก่อนส่งข้อเสนอแนะ Codex สำหรับ
  เธรดที่แนบอยู่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตรา
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของเซิร์ฟเวอร์แอป Codex
- `/codex skills` แสดงรายการ skills ของเซิร์ฟเวอร์แอป Codex

สำหรับรายงานสนับสนุนส่วนใหญ่ ให้เริ่มด้วย `/diagnostics [note]` ในบทสนทนา
ที่เกิดข้อบกพร่อง คำสั่งนี้จะสร้างรายงานการวินิจฉัย Gateway หนึ่งรายการ และสำหรับเซสชัน
ฮาร์เนส Codex จะขออนุมัติให้ส่งชุดข้อเสนอแนะ Codex ที่เกี่ยวข้อง
ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรม
แชตกลุ่ม

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดข้อเสนอแนะ Codex
สำหรับเธรดที่แนบอยู่ในปัจจุบันโดยไม่ต้องมีชุดการวินิจฉัย Gateway แบบเต็มเท่านั้น

### ตรวจสอบเธรด Codex ในเครื่อง

วิธีที่เร็วที่สุดในการตรวจสอบการรัน Codex ที่มีปัญหามักเป็นการเปิดเธรด Codex
แบบเนทีฟโดยตรง:

```bash
codex resume <thread-id>
```

รับรหัสเธรดจากคำตอบ `/diagnostics` ที่เสร็จสมบูรณ์, `/codex binding` หรือ
`/codex threads [filter]`

สำหรับกลไกการอัปโหลดและขอบเขตการวินิจฉัยระดับรันไทม์ ดู
[รันไทม์ฮาร์เนส Codex](/th/plugins/codex-harness-runtime#codex-feedback-upload)

เลือกการยืนยันตัวตนตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenClaw Codex ที่ระบุอย่างชัดเจนสำหรับเอเจนต์
2. บัญชีเดิมของเซิร์ฟเวอร์แอปใน Codex home ของเอเจนต์นั้น
3. สำหรับการเปิดเซิร์ฟเวอร์แอปแบบ stdio ในเครื่องเท่านั้น `CODEX_API_KEY` จากนั้น
   `OPENAI_API_KEY` เมื่อไม่มีบัญชีเซิร์ฟเวอร์แอปอยู่และยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw พบโปรไฟล์การยืนยันตัวตน Codex แบบการสมัครสมาชิก ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่สร้างขึ้น
วิธีนี้ทำให้คีย์ API ระดับ Gateway ยังพร้อมใช้งานสำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้เทิร์นของเซิร์ฟเวอร์แอป Codex แบบเนทีฟถูกคิดค่าบริการผ่าน API โดยไม่ตั้งใจ
โปรไฟล์คีย์ API Codex ที่ระบุอย่างชัดเจนและการสำรองไปใช้คีย์ env ของ stdio ในเครื่องใช้การเข้าสู่ระบบเซิร์ฟเวอร์แอป
แทน env ของกระบวนการลูกที่สืบทอดมา การเชื่อมต่อเซิร์ฟเวอร์แอป WebSocket
จะไม่ได้รับคีย์ API สำรองจาก env ของ Gateway ให้ใช้โปรไฟล์การยืนยันตัวตนที่ระบุอย่างชัดเจนหรือบัญชีของ
เซิร์ฟเวอร์แอประยะไกลเอง

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

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูกเซิร์ฟเวอร์แอป Codex ที่ถูกสร้างขึ้นเท่านั้น

ค่าเริ่มต้นของเครื่องมือแบบไดนามิก Codex คือการโหลดแบบ `searchable` OpenClaw ไม่เปิดเผย
เครื่องมือแบบไดนามิกที่ซ้ำกับการดำเนินการเวิร์กสเปซแบบเนทีฟของ Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` และ `update_plan` เครื่องมือผสานรวม OpenClaw
ที่เหลือ เช่น การส่งข้อความ, เซสชัน, สื่อ, cron, เบราว์เซอร์, โหนด,
gateway, `heartbeat_respond` และ `web_search` พร้อมใช้งานผ่านการค้นหาเครื่องมือ Codex
ภายใต้เนมสเปซ `openclaw` ซึ่งทำให้บริบทโมเดลเริ่มต้น
เล็กลง
`sessions_yield` และการตอบกลับแหล่งที่มาที่เป็นเครื่องมือข้อความเท่านั้นยังคงเป็นแบบตรง เพราะสิ่งเหล่านี้
เป็นสัญญาควบคุมเทิร์น คำสั่งการทำงานร่วมกันของ Heartbeat บอกให้ Codex
ค้นหา `heartbeat_respond` ก่อนจบเทิร์น heartbeat เมื่อเครื่องมือนั้น
ยังไม่ได้โหลด

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับเซิร์ฟเวอร์แอป Codex
แบบกำหนดเองที่ไม่สามารถค้นหาเครื่องมือแบบไดนามิกที่เลื่อนโหลดไว้ หรือเมื่อดีบักเพย์โหลด
เครื่องมือแบบเต็ม

ฟิลด์ Plugin Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น        | ความหมาย                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | ใช้ `"direct"` เพื่อใส่เครื่องมือแบบไดนามิกของ OpenClaw ลงในบริบทเครื่องมือ Codex เริ่มต้นโดยตรง |
| `codexDynamicToolsExclude` | `[]`           | ชื่อเครื่องมือแบบไดนามิกของ OpenClaw เพิ่มเติมที่ต้องละเว้นจากเทิร์นของเซิร์ฟเวอร์แอป Codex              |
| `codexPlugins`             | ปิดใช้งาน       | การรองรับ Plugin/แอป Codex แบบเนทีฟสำหรับ curated plugins ที่ติดตั้งจากซอร์สและถูกย้ายมา           |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                              | `"stdio"` สร้าง Codex; `"websocket"` เชื่อมต่อกับ `url`                                                                                                                                                                             |
| `command`                     | ไบนารี Codex ที่จัดการให้                                   | ไฟล์ปฏิบัติการสำหรับทรานสปอร์ต stdio ไม่ต้องตั้งค่าเพื่อใช้ไบนารีที่จัดการให้; ตั้งค่าเฉพาะเมื่อต้องการโอเวอร์ไรด์อย่างชัดเจน                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับทรานสปอร์ต stdio                                                                                                                                                                                                       |
| `url`                         | ไม่ได้ตั้งค่า                                                  | URL เซิร์ฟเวอร์แอป WebSocket                                                                                                                                                                                                            |
| `authToken`                   | ไม่ได้ตั้งค่า                                                  | โทเคน Bearer สำหรับทรานสปอร์ต WebSocket                                                                                                                                                                                                |
| `headers`                     | `{}`                                                   | ส่วนหัว WebSocket เพิ่มเติม                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากกระบวนการเซิร์ฟเวอร์แอป stdio ที่สร้างขึ้นหลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex รายเอเจนต์ของ OpenClaw ในการเปิดใช้ในเครื่อง |
| `requestTimeoutMs`            | `60000`                                                | เวลาหมดอายุสำหรับการเรียก control-plane ของเซิร์ฟเวอร์แอป                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | ช่วงเงียบหลังคำขอเซิร์ฟเวอร์แอป Codex ที่อยู่ในขอบเขตเทิร์น ขณะที่ OpenClaw รอ `turn/completed` เพิ่มค่านี้สำหรับเฟส post-tool ที่ช้าหรือเฟสสังเคราะห์สถานะอย่างเดียว                                                                  |
| `mode`                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ในเครื่องจะไม่อนุญาต YOLO | พรีเซ็ตสำหรับการดำเนินการแบบ YOLO หรือแบบมี guardian รีวิว ข้อกำหนด stdio ในเครื่องที่ละเว้น `danger-full-access`, การอนุมัติ `never` หรือผู้รีวิว `user` จะทำให้ค่าเริ่มต้นโดยนัยเป็น guardian                                                |
| `approvalPolicy`              | `"never"` หรือนโยบายการอนุมัติ guardian ที่อนุญาต       | นโยบายการอนุมัติ Codex แบบเนทีฟที่ส่งไปยังการเริ่ม/กลับมาใช้ต่อ/เทิร์นของเธรด ค่าเริ่มต้นของ guardian จะใช้ `"on-request"` เมื่ออนุญาต                                                                                                                 |
| `sandbox`                     | `"danger-full-access"` หรือ sandbox ของ guardian ที่อนุญาต  | โหมด sandbox Codex แบบเนทีฟที่ส่งไปยังการเริ่ม/กลับมาใช้ต่อของเธรด ค่าเริ่มต้นของ guardian จะใช้ `"workspace-write"` เมื่ออนุญาต ไม่เช่นนั้นใช้ `"read-only"`                                                                                           |
| `approvalsReviewer`           | `"user"` หรือผู้รีวิว guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex รีวิวพรอมป์การอนุมัติแบบเนทีฟเมื่ออนุญาต ไม่เช่นนั้นใช้ `guardian_subagent` หรือ `user` `guardian_subagent` ยังคงเป็น alias แบบเดิม                                                                   |
| `serviceTier`                 | ไม่ได้ตั้งค่า                                                  | ระดับบริการเซิร์ฟเวอร์แอป Codex ที่ไม่บังคับ `"priority"` เปิดใช้การกำหนดเส้นทางโหมดเร็ว, `"flex"` ขอการประมวลผล flex, `null` ล้างโอเวอร์ไรด์ และ `"fast"` แบบเดิมจะถูกรับเป็น `"priority"`                                      |

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของจะถูกจำกัดแยกจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` ใช้ watchdog ของ
OpenClaw 30 วินาทีเป็นค่าเริ่มต้น อาร์กิวเมนต์ `timeoutMs` ต่อการเรียกที่เป็นบวกจะขยาย
หรือย่นงบเวลาของเครื่องมือนั้นโดยเฉพาะ เครื่องมือ `image_generate` ยังใช้
`agents.defaults.imageGenerationModel.timeoutMs` เมื่อการเรียกเครื่องมือไม่ได้
ระบุเวลาหมดอายุของตัวเอง และเครื่องมือ `image` สำหรับการทำความเข้าใจสื่อใช้
`tools.media.image.timeoutSeconds` หรือค่าเริ่มต้นสื่อ 60 วินาที งบเวลาเครื่องมือแบบไดนามิก
ถูกจำกัดสูงสุดที่ 600000 ms เมื่อหมดเวลา OpenClaw จะยกเลิกสัญญาณเครื่องมือ
ในที่ที่รองรับ และส่งคืนการตอบสนองเครื่องมือแบบไดนามิกที่ล้มเหลวให้ Codex เพื่อให้เทิร์น
ดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก OpenClaw ตอบสนองคำขอเซิร์ฟเวอร์แอป Codex ที่อยู่ในขอบเขตเทิร์นแล้ว ฮาร์เนส
ยังคาดหวังให้ Codex จบเทิร์นแบบเนทีฟด้วย `turn/completed` หาก
เซิร์ฟเวอร์แอปเงียบไปเป็นเวลา `appServer.turnCompletionIdleTimeoutMs` หลังจาก
การตอบสนองนั้น OpenClaw จะพยายามขัดจังหวะเทิร์น Codex แบบ best-effort บันทึกการวินิจฉัย
เวลาหมดอายุ และปล่อยเลนเซสชัน OpenClaw เพื่อไม่ให้ข้อความแชตติดตามผล
ถูกคิวไว้หลังเทิร์นเนทีฟที่ค้างอยู่ การแจ้งเตือนที่ไม่ใช่ปลายทางใดๆ สำหรับ
เทิร์นเดียวกัน รวมถึง `rawResponseItem/completed` จะปลด watchdog สั้นนั้น
เพราะ Codex พิสูจน์แล้วว่าเทิร์นยังมีชีวิตอยู่; watchdog ปลายทางที่ยาวกว่า
ยังคงป้องกันเทิร์นที่ค้างจริง การวินิจฉัยเวลาหมดอายุรวมเมธอดการแจ้งเตือน
ล่าสุดของเซิร์ฟเวอร์แอป และสำหรับรายการการตอบสนอง assistant แบบ raw จะรวม
ชนิดรายการ, บทบาท, id และตัวอย่างข้อความ assistant ที่มีขอบเขตจำกัด

โอเวอร์ไรด์สภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ข้ามไบนารีที่จัดการให้เมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบออกแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว ควรใช้การตั้งค่า
สำหรับการปรับใช้ที่ทำซ้ำได้ เพราะจะเก็บพฤติกรรมของ Plugin ไว้ในไฟล์ที่ผ่านการตรวจสอบเดียวกันกับ
การตั้งค่า Codex harness ส่วนที่เหลือ

## Plugin Codex แบบเนทีฟ

การรองรับ Plugin Codex แบบเนทีฟใช้ความสามารถของแอปและ Plugin ของ Codex app-server เอง
ในเธรด Codex เดียวกับรอบ OpenClaw harness OpenClaw
จะไม่แปล Plugin Codex เป็นเครื่องมือไดนามิก OpenClaw สังเคราะห์ `codex_plugin_*`

`codexPlugins` มีผลเฉพาะกับเซสชันที่เลือก Codex harness แบบเนทีฟเท่านั้น ไม่มีผลต่อการรัน PI,
การรันผู้ให้บริการ OpenAI ปกติ, การผูกบทสนทนา ACP หรือ harness อื่นๆ

การตั้งค่าขั้นต่ำหลังย้ายแล้ว:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

การตั้งค่าแอปของเธรดจะถูกคำนวณเมื่อ OpenClaw สร้างเซสชัน Codex harness
หรือแทนที่การผูกเธรด Codex ที่ล้าสมัย จะไม่ถูกคำนวณใหม่ในทุกๆ รอบ
หลังจากเปลี่ยน `codexPlugins` ให้ใช้ `/new`, `/reset` หรือรีสตาร์ต Gateway เพื่อให้
เซสชัน Codex harness ในอนาคตเริ่มด้วยชุดแอปที่อัปเดตแล้ว

สำหรับคุณสมบัติในการย้าย, รายการแอป, นโยบายการกระทำที่ทำลายข้อมูล,
elicitations และการวินิจฉัย Plugin แบบเนทีฟ โปรดดู
[Plugin Codex แบบเนทีฟ](/th/plugins/codex-native-plugins)

## Computer Use

Computer Use มีคู่มือการตั้งค่าแยกต่างหาก:
[Codex Computer Use](/th/plugins/codex-computer-use).

สรุปสั้นๆ: OpenClaw ไม่ได้รวมแอปควบคุมเดสก์ท็อปไว้ในตัวหรือเรียกใช้
การกระทำบนเดสก์ท็อปเอง แต่จะเตรียม Codex app-server, ตรวจสอบว่า
MCP server `computer-use` พร้อมใช้งาน แล้วปล่อยให้ Codex เป็นเจ้าของการเรียกเครื่องมือ MCP
แบบเนทีฟในระหว่างรอบโหมด Codex

## ขอบเขตรันไทม์

Codex harness เปลี่ยนเฉพาะตัวดำเนินการเอเจนต์แบบฝังตัวระดับต่ำเท่านั้น

- รองรับเครื่องมือไดนามิกของ OpenClaw Codex ขอให้ OpenClaw เรียกใช้
  เครื่องมือเหล่านั้น ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการดำเนินการ
- เครื่องมือ shell, patch, MCP และเครื่องมือแอปแบบเนทีฟของ Codex เป็นของ Codex
  OpenClaw สามารถสังเกตหรือบล็อกเหตุการณ์เนทีฟบางรายการผ่าน relay ที่รองรับ
  แต่จะไม่เขียนอาร์กิวเมนต์เครื่องมือเนทีฟใหม่
- Codex เป็นเจ้าของ Compaction แบบเนทีฟ OpenClaw เก็บสำเนาถอดเสียงไว้สำหรับประวัติช่องทาง,
  การค้นหา, `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต
- การสร้างสื่อ, การทำความเข้าใจสื่อ, TTS, การอนุมัติ และเอาต์พุตของเครื่องมือรับส่งข้อความ
  ยังคงผ่านการตั้งค่าผู้ให้บริการ/โมเดล OpenClaw ที่ตรงกัน
- `tool_result_persist` ใช้กับผลลัพธ์เครื่องมือในสำเนาถอดเสียงที่ OpenClaw เป็นเจ้าของ ไม่ใช่
  ระเบียนผลลัพธ์เครื่องมือแบบเนทีฟของ Codex

สำหรับชั้น hook, พื้นผิว V1 ที่รองรับ, การจัดการสิทธิ์แบบเนทีฟ, การนำทางคิว,
กลไกอัปโหลดข้อเสนอแนะของ Codex และรายละเอียด Compaction โปรดดู
[รันไทม์ Codex harness](/th/plugins/codex-harness-runtime)

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็นผู้ให้บริการ `/model` ปกติ:** นี่เป็นพฤติกรรมที่คาดไว้สำหรับ
การตั้งค่าใหม่ ให้เลือกโมเดล `openai/gpt-*`, เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` กีดกัน
`codex` หรือไม่

**OpenClaw ใช้ PI แทน Codex:** ตรวจสอบให้แน่ใจว่า model ref เป็น
`openai/gpt-*` บนผู้ให้บริการ OpenAI อย่างเป็นทางการ และติดตั้งพร้อมเปิดใช้ Plugin Codex แล้ว
หากต้องการหลักฐานที่เข้มงวดระหว่างทดสอบ ให้ตั้งค่า `agentRuntime.id: "codex"` ที่ผู้ให้บริการหรือ
โมเดล รันไทม์ Codex ที่บังคับใช้จะล้มเหลวแทนที่จะ fallback ไปยัง PI

**การตั้งค่า `openai-codex/*` เดิมยังคงอยู่:** เรียกใช้ `openclaw doctor --fix`
Doctor จะเขียน model refs เดิมใหม่เป็น `openai/*`, ลบการปักรันไทม์ของเซสชันที่ล้าสมัยและ
ทั้งเอเจนต์ และคงการ override auth-profile ที่มีอยู่ไว้

**app-server ถูกปฏิเสธ:** ใช้ Codex app-server `0.125.0` หรือใหม่กว่า
พรีรีลีสเวอร์ชันเดียวกันหรือเวอร์ชันที่มีคำต่อท้าย build เช่น
`0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ OpenClaw ทดสอบตาม
protocol floor เสถียร `0.125.0`

**`/codex status` เชื่อมต่อไม่ได้:** ตรวจสอบว่า Plugin `codex` ที่รวมมา
เปิดใช้อยู่, `plugins.allow` รวม Plugin นี้ไว้เมื่อมีการตั้งค่า allowlist และ
`appServer.command`, `url`, `authToken` หรือ headers แบบกำหนดเองใดๆ ถูกต้อง

**การค้นพบโมเดลช้า:** ลดค่า
`plugins.entries.codex.config.discovery.timeoutMs` หรือปิดใช้การค้นพบ โปรดดู
[ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference#model-discovery)

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`,
headers และว่า app-server ระยะไกลใช้ protocol version ของ Codex app-server เดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นพฤติกรรมที่คาดไว้ เว้นแต่นโยบายรันไทม์ของผู้ให้บริการหรือโมเดล
จะนำทางไปยัง harness อื่น refs ของผู้ให้บริการที่ไม่ใช่ OpenAI แบบปกติจะอยู่บน
เส้นทางผู้ให้บริการปกติในโหมด `auto`

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงาน
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ต
Gateway เพื่อล้างการลงทะเบียน hook แบบเนทีฟที่ล้าสมัย โปรดดู
[Codex Computer Use](/th/plugins/codex-computer-use#troubleshooting)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)
- [รันไทม์ Codex harness](/th/plugins/codex-harness-runtime)
- [Plugin Codex แบบเนทีฟ](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [Plugin agent harness](/th/plugins/sdk-agent-harness)
- [Plugin hooks](/th/plugins/hooks)
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
- [สถานะ](/th/cli/status)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
