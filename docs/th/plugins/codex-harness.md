---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่มาพร้อมแพ็กเกจ
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนส Codex
    - คุณต้องการให้การปรับใช้แบบ Codex เท่านั้นล้มเหลวแทนที่จะย้อนกลับไปใช้ Pi
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาให้
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-05-11T20:34:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่บันเดิลมาช่วยให้ OpenClaw เรียกใช้เทิร์นของเอเจนต์ OpenAI แบบฝังตัว
ผ่าน Codex app-server แทน harness PI ในตัว

ใช้ Codex harness เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง:
การดำเนินเธรดต่อแบบเนทีฟ, การดำเนินเครื่องมือต่อแบบเนทีฟ, Compaction แบบเนทีฟ และ
การดำเนินการผ่าน app-server OpenClaw ยังเป็นเจ้าของช่องแชท, ไฟล์เซสชัน, การเลือกโมเดล,
เครื่องมือไดนามิกของ OpenClaw, การอนุมัติ, การส่งสื่อ และมิเรอร์ transcript ที่มองเห็นได้

การตั้งค่าปกติใช้ refs โมเดล OpenAI แบบ canonical เช่น `openai/gpt-5.5`
อย่ากำหนดค่า refs โมเดล `openai-codex/gpt-*` ใส่ลำดับ auth ของเอเจนต์ OpenAI
ไว้ใต้ `auth.order.openai`; โปรไฟล์ `openai-codex:*` แบบเก่าและรายการ
`auth.order.openai-codex` ยังคงรองรับสำหรับการติดตั้งเดิม

OpenClaw เริ่มเธรด Codex app-server ด้วยโหมดโค้ดเนทีฟของ Codex และ
เปิดใช้เฉพาะโหมดโค้ด นั่นทำให้เครื่องมือไดนามิกของ OpenClaw ที่เลื่อนเวลา/ค้นหาได้
อยู่ภายในการดำเนินโค้ดและพื้นผิวค้นหาเครื่องมือของ Codex เอง แทนที่จะเพิ่ม
wrapper ค้นหาเครื่องมือแบบ PI ซ้อนทับ Codex

สำหรับภาพรวมที่กว้างขึ้นของการแยกโมเดล/ผู้ให้บริการ/รันไทม์ ให้เริ่มที่
[รันไทม์เอเจนต์](/th/concepts/agent-runtimes) เวอร์ชันสั้นคือ:
`openai/gpt-5.5` คือ ref โมเดล, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องอื่นยังคงเป็นพื้นผิวการสื่อสาร

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` แบบบันเดิลพร้อมใช้งาน
- หาก config ของคุณใช้ `plugins.allow` ให้รวม `codex` ไว้ด้วย
- Codex app-server `0.125.0` หรือใหม่กว่า Plugin ที่บันเดิลมาจะจัดการไบนารี
  Codex app-server ที่เข้ากันได้โดยค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ภายในเครื่องบน `PATH` จะไม่
  ส่งผลต่อการเริ่ม harness ตามปกติ
- Codex auth พร้อมใช้งานผ่าน `openclaw models auth login --provider openai-codex`,
  บัญชี app-server ใน Codex home ของเอเจนต์ หรือโปรไฟล์ auth แบบ API key ของ Codex
  ที่ระบุอย่างชัดเจน

สำหรับลำดับความสำคัญของ auth, การแยก environment, คำสั่ง app-server แบบกำหนดเอง,
การค้นพบโมเดล และฟิลด์ config ทั้งหมด โปรดดู
[อ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## เริ่มต้นอย่างรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ Codex ใน OpenClaw ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครสมาชิก ChatGPT/Codex, เปิดใช้ Plugin `codex` ที่บันเดิลมา และใช้
ref โมเดล canonical `openai/gpt-*`

ลงชื่อเข้าใช้ด้วย Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

เปิดใช้ Plugin `codex` ที่บันเดิลมาและเลือกโมเดลเอเจนต์ OpenAI:

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

รีสตาร์ต gateway หลังจากเปลี่ยน config ของ Plugin หากแชทเดิมมีเซสชันอยู่แล้ว
ให้ใช้ `/new` หรือ `/reset` ก่อนทดสอบการเปลี่ยนรันไทม์ เพื่อให้เทิร์นถัดไป
resolve harness จาก config ปัจจุบัน

## การกำหนดค่า

config เริ่มต้นอย่างรวดเร็วคือ config Codex harness ขั้นต่ำที่ใช้งานได้ ตั้งค่าตัวเลือก
Codex harness ใน config ของ OpenClaw และใช้ CLI สำหรับ Codex auth เท่านั้น:

| ความต้องการ | ตั้งค่า | ตำแหน่ง |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| เปิดใช้ harness | `plugins.entries.codex.enabled: true` | config ของ OpenClaw |
| เก็บการติดตั้ง Plugin แบบ allowlist | รวม `codex` ใน `plugins.allow` | config ของ OpenClaw |
| ส่งเทิร์นเอเจนต์ OpenAI ผ่าน Codex | `agents.defaults.model` หรือ `agents.list[].model` เป็น `openai/gpt-*` | config เอเจนต์ของ OpenClaw |
| ลงชื่อเข้าใช้ด้วย Codex OAuth | `openclaw models auth login --provider openai-codex` | โปรไฟล์ auth ของ CLI |
| เพิ่ม API key สำรองสำหรับการเรียกใช้ Codex | โปรไฟล์ API key `openai:*` ที่ระบุหลัง subscription auth ใน `auth.order.openai` | โปรไฟล์ auth ของ CLI + config ของ OpenClaw |
| ปิดแบบล้มเหลวเมื่อ Codex ไม่พร้อมใช้งาน | Provider หรือโมเดล `agentRuntime.id: "codex"` | config โมเดล/ผู้ให้บริการของ OpenClaw |
| ใช้ทราฟฟิก OpenAI API โดยตรง | Provider หรือโมเดล `agentRuntime.id: "pi"` พร้อม OpenAI auth ปกติ | config โมเดล/ผู้ให้บริการของ OpenClaw |
| ปรับพฤติกรรม app-server | `plugins.entries.codex.config.appServer.*` | config Plugin Codex |
| เปิดใช้แอป Plugin เนทีฟของ Codex | `plugins.entries.codex.config.codexPlugins.*` | config Plugin Codex |
| เปิดใช้ Codex Computer Use | `plugins.entries.codex.config.computerUse.*` | config Plugin Codex |

ใช้ refs โมเดล `openai/gpt-*` สำหรับเทิร์นเอเจนต์ OpenAI ที่รองรับด้วย Codex ควรใช้
`auth.order.openai` สำหรับลำดับแบบ subscription ก่อน/API key สำรอง โปรไฟล์ auth
`openai-codex:*` เดิมและ `auth.order.openai-codex` ยังคงใช้ได้ แต่อย่าเขียน
refs โมเดล `openai-codex/gpt-*` ใหม่

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ในรูปแบบนั้น โปรไฟล์ทั้งสองยังคงเรียกผ่าน Codex สำหรับเทิร์นเอเจนต์ `openai/gpt-*`
API key เป็นเพียง auth fallback ไม่ใช่คำขอให้สลับไปใช้ PI หรือ
OpenAI Responses แบบตรง

ส่วนที่เหลือของหน้านี้ครอบคลุมตัวแปรทั่วไปที่ผู้ใช้ต้องเลือก:
รูปแบบ deployment, การ routing แบบ fail-closed, นโยบายการอนุมัติ guardian, Plugin
เนทีฟของ Codex และ Computer Use สำหรับรายการตัวเลือกทั้งหมด, ค่าเริ่มต้น, enum, การค้นพบ,
การแยก environment, timeout และฟิลด์ transport ของ app-server โปรดดู
[อ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## ตรวจสอบรันไทม์ Codex

ใช้ `/status` ในแชทที่คุณคาดว่าจะเป็น Codex เทิร์นเอเจนต์ OpenAI ที่รองรับด้วย Codex
จะแสดง:

```text
Runtime: OpenAI Codex
```

จากนั้นตรวจสอบสถานะ Codex app-server:

```text
/codex status
/codex models
```

`/codex status` รายงานการเชื่อมต่อ app-server, บัญชี, rate limits, เซิร์ฟเวอร์ MCP
และ skills `/codex models` แสดงแคตตาล็อก Codex app-server แบบสดสำหรับ
harness และบัญชี หาก `/status` ให้ผลที่ไม่คาดคิด โปรดดู
[การแก้ไขปัญหา](#troubleshooting)

## การกำหนดเส้นทางและการเลือกโมเดล

แยก refs ของผู้ให้บริการออกจากนโยบายรันไทม์:

- ใช้ `openai/gpt-*` สำหรับเทิร์นเอเจนต์ OpenAI ผ่าน Codex
- อย่าใช้ `openai-codex/gpt-*` ใน config เรียกใช้ `openclaw doctor --fix` เพื่อ
  ซ่อม refs เดิมและ pins เส้นทางเซสชันที่ค้างอยู่
- `agentRuntime.id: "codex"` เป็นทางเลือกสำหรับโหมดอัตโนมัติของ OpenAI ปกติ แต่มีประโยชน์
  เมื่อ deployment ควรล้มเหลวแบบปิดหาก Codex ไม่พร้อมใช้งาน
- `agentRuntime.id: "pi"` เลือกให้ผู้ให้บริการหรือโมเดลเข้าสู่พฤติกรรม PI โดยตรงเมื่อ
  นั่นเป็นความตั้งใจ
- `/codex ...` ควบคุมการสนทนา Codex app-server แบบเนทีฟจากแชท
- ACP/acpx เป็นเส้นทาง harness ภายนอกที่แยกต่างหาก ใช้เฉพาะเมื่อผู้ใช้ขอ
  ACP/acpx หรืออะแดปเตอร์ harness ภายนอก

การกำหนดเส้นทางคำสั่งทั่วไป:

| เจตนาของผู้ใช้ | ใช้ |
| ------------------------------- | --------------------------------------- |
| แนบแชทปัจจุบัน | `/codex bind [--cwd <path>]` |
| ดำเนินเธรด Codex เดิมต่อ | `/codex resume <thread-id>` |
| แสดงรายการหรือกรองเธรด Codex | `/codex threads [filter]` |
| ส่ง feedback ให้ Codex เท่านั้น | `/codex diagnostics [note]` |
| เริ่มงาน ACP/acpx | คำสั่งเซสชัน ACP/acpx ไม่ใช่ `/codex` |

| กรณีใช้งาน | กำหนดค่า | ตรวจสอบ | หมายเหตุ |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-*` พร้อมเปิดใช้ Plugin `codex` | `/status` แสดง `Runtime: OpenAI Codex` | เส้นทางที่แนะนำ |
| ล้มเหลวแบบปิดหาก Codex ไม่พร้อมใช้งาน | Provider หรือโมเดล `agentRuntime.id: "codex"` | เทิร์นล้มเหลวแทน PI fallback | ใช้สำหรับ deployment เฉพาะ Codex |
| ทราฟฟิก OpenAI API key โดยตรงผ่าน PI | Provider หรือโมเดล `agentRuntime.id: "pi"` และ OpenAI auth ปกติ | `/status` แสดงรันไทม์ PI | ใช้เฉพาะเมื่อ PI เป็นความตั้งใจ |
| config เดิม | `openai-codex/gpt-*` | `openclaw doctor --fix` เขียนใหม่ | อย่าเขียน config ใหม่ด้วยวิธีนี้ |
| อะแดปเตอร์ Codex แบบ ACP/acpx | ACP `sessions_spawn({ runtime: "acp" })` | สถานะงาน/เซสชัน ACP | แยกจาก Codex harness แบบเนทีฟ |

`agents.defaults.imageModel` ใช้การแบ่ง prefix แบบเดียวกัน ใช้ `openai/gpt-*`
สำหรับเส้นทาง OpenAI ปกติ และ `codex/gpt-*` เฉพาะเมื่อการทำความเข้าใจภาพ
ควรเรียกผ่านเทิร์น Codex app-server ที่มีขอบเขต อย่าใช้
`openai-codex/gpt-*`; doctor จะเขียน prefix เดิมนั้นใหม่เป็น `openai/gpt-*`

## รูปแบบ Deployment

### Deployment Codex พื้นฐาน

ใช้ config เริ่มต้นอย่างรวดเร็วเมื่อเทิร์นเอเจนต์ OpenAI ทั้งหมดควรใช้ Codex
โดยค่าเริ่มต้น

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

### Deployment ผู้ให้บริการแบบผสม

รูปแบบนี้ทำให้ Claude เป็นเอเจนต์เริ่มต้นและเพิ่มเอเจนต์ Codex แบบมีชื่อ:

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

ด้วย config นี้ เอเจนต์ `main` ใช้เส้นทางผู้ให้บริการปกติของตน และเอเจนต์
`codex` ใช้ Codex app-server

### Deployment Codex แบบ fail-closed

สำหรับเทิร์นเอเจนต์ OpenAI, `openai/gpt-*` จะ resolve เป็น Codex อยู่แล้วเมื่อ
Plugin ที่บันเดิลมาพร้อมใช้งาน เพิ่มนโยบายรันไทม์ที่ชัดเจนเมื่อคุณต้องการกฎ
fail-closed แบบเป็นลายลักษณ์อักษร:

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

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Plugin Codex ถูกปิดใช้,
app-server เก่าเกินไป หรือ app-server เริ่มทำงานไม่ได้

## นโยบาย app-server

โดยค่าเริ่มต้น Plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการภายในเครื่องด้วย stdio
transport ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจจะเรียกใช้ executable
อื่น ใช้ WebSocket transport เฉพาะเมื่อ app-server กำลังทำงานอยู่ที่อื่นแล้ว:

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

เซสชันแอปเซิร์ฟเวอร์ stdio ในเครื่องจะใช้ท่าทางผู้ปฏิบัติการในเครื่องที่เชื่อถือได้เป็นค่าเริ่มต้น:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, และ
`sandbox: "danger-full-access"` หากข้อกำหนด Codex ในเครื่องไม่อนุญาต
ท่าทาง YOLO โดยนัยนี้ OpenClaw จะเลือกสิทธิ์ guardian ที่อนุญาตแทน
เมื่อ sandbox ของ OpenClaw ทำงานอยู่สำหรับเซสชัน OpenClaw จะจำกัด Codex
`danger-full-access` ให้เป็น Codex `workspace-write` เพื่อให้เทิร์น code-mode
ของ Codex แบบเนทีฟอยู่ภายในเวิร์กสเปซที่ถูก sandbox

ใช้โหมด guardian เมื่อคุณต้องการให้ Codex ทำการตรวจสอบอัตโนมัติแบบเนทีฟก่อน
ออกนอก sandbox หรือขอสิทธิ์เพิ่มเติม:

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

โหมด guardian จะขยายเป็นการอนุมัติของแอปเซิร์ฟเวอร์ Codex โดยปกติคือ
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, และ
`sandbox: "workspace-write"` เมื่อข้อกำหนดในเครื่องอนุญาตค่าเหล่านั้น

สำหรับทุกฟิลด์ของแอปเซิร์ฟเวอร์ ลำดับการยืนยันตัวตน การแยกสภาพแวดล้อม การค้นพบ และ
พฤติกรรม timeout โปรดดู [เอกสารอ้างอิงฮาร์เนส Codex](/th/plugins/codex-harness-reference)

## คำสั่งและการวินิจฉัย

Plugin ที่รวมมาจะลงทะเบียน `/codex` เป็นคำสั่ง slash บนช่องทางใดก็ตามที่
รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่พบบ่อย:

- `/codex status` ตรวจสอบการเชื่อมต่อแอปเซิร์ฟเวอร์ โมเดล บัญชี ขีดจำกัดอัตรา
  เซิร์ฟเวอร์ MCP และ skills
- `/codex models` แสดงรายการโมเดลแอปเซิร์ฟเวอร์ Codex แบบสด
- `/codex threads [filter]` แสดงรายการเธรดแอปเซิร์ฟเวอร์ Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับ
  เธรด Codex ที่มีอยู่
- `/codex compact` ขอให้แอปเซิร์ฟเวอร์ Codex ทำการ compact เธรดที่แนบอยู่
- `/codex review` เริ่มการตรวจสอบแบบเนทีฟของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` จะถามก่อนส่ง feedback ของ Codex สำหรับ
  เธรดที่แนบอยู่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตรา
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของแอปเซิร์ฟเวอร์ Codex
- `/codex skills` แสดงรายการ skills ของแอปเซิร์ฟเวอร์ Codex

สำหรับรายงานสนับสนุนส่วนใหญ่ ให้เริ่มด้วย `/diagnostics [note]` ในบทสนทนา
ที่บั๊กเกิดขึ้น คำสั่งนี้จะสร้างรายงานการวินิจฉัย Gateway หนึ่งฉบับ และสำหรับเซสชัน
ฮาร์เนส Codex จะขออนุมัติเพื่อส่งบันเดิล feedback ของ Codex ที่เกี่ยวข้อง
ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรม
ของแชตกลุ่ม

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลด feedback ของ Codex
สำหรับเธรดที่แนบอยู่ในปัจจุบันโดยเฉพาะ โดยไม่รวมบันเดิลการวินิจฉัย Gateway แบบเต็ม

### ตรวจสอบเธรด Codex ในเครื่อง

วิธีที่เร็วที่สุดในการตรวจสอบการรัน Codex ที่ผิดพลาดมักเป็นการเปิดเธรด Codex
แบบเนทีฟโดยตรง:

```bash
codex resume <thread-id>
```

รับ thread id จากคำตอบ `/diagnostics` ที่เสร็จแล้ว, `/codex binding`, หรือ
`/codex threads [filter]`

สำหรับกลไกการอัปโหลดและขอบเขตการวินิจฉัยระดับ runtime โปรดดู
[runtime ของฮาร์เนส Codex](/th/plugins/codex-harness-runtime#codex-feedback-upload)

การยืนยันตัวตนถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenAI ที่เรียงลำดับไว้สำหรับ agent โดยควรอยู่ใต้
   `auth.order.openai` รหัสโปรไฟล์ `openai-codex:*` ที่มีอยู่ยังคงใช้ได้
2. บัญชีที่มีอยู่ของแอปเซิร์ฟเวอร์ใน Codex home ของ agent นั้น
3. สำหรับการเปิดแอปเซิร์ฟเวอร์ stdio ในเครื่องเท่านั้น ใช้ `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อไม่มีบัญชีแอปเซิร์ฟเวอร์อยู่ และยังจำเป็นต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw พบโปรไฟล์การยืนยันตัวตน Codex แบบการสมัครสมาชิก ChatGPT ระบบจะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ถูก spawn
วิธีนี้ทำให้คีย์ API ระดับ Gateway ยังคงพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI
โดยตรง โดยไม่ทำให้เทิร์นของแอปเซิร์ฟเวอร์ Codex แบบเนทีฟถูกคิดค่าบริการผ่าน API
โดยไม่ตั้งใจ โปรไฟล์คีย์ API Codex แบบชัดเจนและ fallback env-key ของ stdio ในเครื่อง
ใช้การเข้าสู่ระบบแอปเซิร์ฟเวอร์แทน env ของกระบวนการลูกที่สืบทอดมา การเชื่อมต่อ
แอปเซิร์ฟเวอร์ WebSocket จะไม่ได้รับ fallback คีย์ API จาก env ของ Gateway;
ให้ใช้โปรไฟล์การยืนยันตัวตนแบบชัดเจนหรือบัญชีของแอปเซิร์ฟเวอร์ระยะไกลเอง

หากโปรไฟล์การสมัครสมาชิกชนขีดจำกัดการใช้งาน Codex OpenClaw จะบันทึกเวลา reset
เมื่อ Codex รายงานเวลาไว้ และลองใช้โปรไฟล์การยืนยันตัวตนถัดไปที่เรียงลำดับไว้สำหรับ
การรัน Codex เดียวกัน เมื่อถึงเวลา reset โปรไฟล์การสมัครสมาชิกจะกลับมาเข้าเกณฑ์อีกครั้ง
โดยไม่ต้องเปลี่ยนโมเดล `openai/gpt-*` หรือ runtime ของ Codex ที่เลือกไว้

หาก deployment ต้องการการแยกสภาพแวดล้อมเพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นลงใน
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

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูกของแอปเซิร์ฟเวอร์ Codex ที่ถูก spawn เท่านั้น

เครื่องมือ dynamic ของ Codex ใช้การโหลดแบบ `searchable` เป็นค่าเริ่มต้น OpenClaw ไม่เปิดเผย
เครื่องมือ dynamic ที่ซ้ำกับการดำเนินการเวิร์กสเปซแบบเนทีฟของ Codex ได้แก่ `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, และ `update_plan` เครื่องมือผสานรวม OpenClaw
ที่เหลือ เช่น การส่งข้อความ เซสชัน สื่อ cron เบราว์เซอร์ nodes
gateway, `heartbeat_respond`, และ `web_search` พร้อมใช้งานผ่านการค้นหาเครื่องมือของ Codex
ภายใต้ namespace `openclaw` ทำให้ context เริ่มต้นของโมเดลเล็กลง
`sessions_yield` และคำตอบแหล่งที่มาแบบ message-tool-only ยังคงเป็นแบบตรง เพราะสิ่งเหล่านั้น
เป็นสัญญาการควบคุมเทิร์น คำสั่งการทำงานร่วมกันของ Heartbeat จะบอกให้ Codex
ค้นหา `heartbeat_respond` ก่อนจบเทิร์น heartbeat เมื่อเครื่องมือนั้นยังไม่ได้ถูกโหลด

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับแอปเซิร์ฟเวอร์ Codex
แบบกำหนดเองที่ไม่สามารถค้นหาเครื่องมือ dynamic ที่เลื่อนไว้ได้ หรือเมื่อ debug payload
เครื่องมือแบบเต็ม

ฟิลด์ Plugin Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น        | ความหมาย                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | ใช้ `"direct"` เพื่อใส่เครื่องมือ dynamic ของ OpenClaw ลงใน context เครื่องมือ Codex เริ่มต้นโดยตรง |
| `codexDynamicToolsExclude` | `[]`           | ชื่อเครื่องมือ dynamic ของ OpenClaw เพิ่มเติมที่จะละเว้นจากเทิร์นของแอปเซิร์ฟเวอร์ Codex              |
| `codexPlugins`             | ปิดใช้งาน       | การรองรับ Plugin/app ของ Codex แบบเนทีฟสำหรับ Plugin curated ที่ติดตั้งจากซอร์สและถูกย้ายมา           |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` spawn Codex; `"websocket"` เชื่อมต่อกับ `url`                                                                                                                                                                                |
| `command`                     | ไบนารี Codex ที่จัดการให้                                   | ไฟล์ปฏิบัติการสำหรับ transport stdio ปล่อยว่างไว้เพื่อใช้ไบนารีที่จัดการให้; ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับ transport stdio                                                                                                                                                                                                          |
| `url`                         | ไม่ได้ตั้งค่า                                                  | URL ของแอปเซิร์ฟเวอร์ WebSocket                                                                                                                                                                                                               |
| `authToken`                   | ไม่ได้ตั้งค่า                                                  | โทเคน Bearer สำหรับ transport WebSocket                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | header WebSocket เพิ่มเติม                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากกระบวนการแอปเซิร์ฟเวอร์ stdio ที่ถูก spawn หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex ต่อ agent ของ OpenClaw ในการเปิดใช้งานในเครื่อง    |
| `requestTimeoutMs`            | `60000`                                                | Timeout สำหรับการเรียก control-plane ของแอปเซิร์ฟเวอร์                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | ช่วงเวลาที่เงียบหลังคำขอแอปเซิร์ฟเวอร์ Codex ที่มีขอบเขตเป็นเทิร์น ขณะที่ OpenClaw รอ `turn/completed` เพิ่มค่านี้สำหรับเฟสสังเคราะห์ที่ช้าหลังใช้เครื่องมือหรือมีเฉพาะสถานะ                                                                     |
| `mode`                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ในเครื่องจะไม่อนุญาต YOLO | preset สำหรับการทำงานแบบ YOLO หรือที่ผ่านการตรวจสอบโดย guardian ข้อกำหนด stdio ในเครื่องที่ไม่มี `danger-full-access`, การอนุมัติ `never`, หรือ reviewer `user` จะทำให้ค่าเริ่มต้นโดยนัยเป็น guardian                                                   |
| `approvalPolicy`              | `"never"` หรือนโยบายการอนุมัติ guardian ที่อนุญาต       | นโยบายการอนุมัติ Codex แบบเนทีฟที่ส่งไปยังการเริ่ม/กลับมาใช้ต่อ/เทิร์นของเธรด ค่าเริ่มต้นของ guardian จะเลือก `"on-request"` เมื่ออนุญาต                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` หรือ sandbox guardian ที่อนุญาต  | โหมด sandbox Codex แบบเนทีฟที่ส่งไปยังการเริ่ม/กลับมาใช้ต่อของเธรด ค่าเริ่มต้นของ guardian จะเลือก `"workspace-write"` เมื่ออนุญาต มิฉะนั้นใช้ `"read-only"` เมื่อ sandbox ของ OpenClaw ทำงานอยู่ `danger-full-access` จะถูกจำกัดเป็น `"workspace-write"` |
| `approvalsReviewer`           | `"user"` หรือ reviewer guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจสอบ prompt การอนุมัติแบบเนทีฟเมื่ออนุญาต มิฉะนั้นใช้ `guardian_subagent` หรือ `user` `guardian_subagent` ยังคงเป็น alias แบบ legacy                                                                      |
| `serviceTier`                 | ไม่ได้ตั้งค่า                                                  | service tier ของแอปเซิร์ฟเวอร์ Codex แบบไม่บังคับ `"priority"` เปิดใช้การกำหนดเส้นทาง fast-mode, `"flex"` ขอการประมวลผล flex, `null` ล้าง override, และ legacy `"fast"` ยอมรับเป็น `"priority"`                                         |

การเรียกใช้เครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดอย่างเป็นอิสระจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` ใช้ watchdog ของ
OpenClaw ค่าเริ่มต้น 30 วินาที อาร์กิวเมนต์ `timeoutMs` ต่อการเรียกที่เป็นค่าบวกจะขยาย
หรือลดงบเวลาของเครื่องมือนั้นโดยเฉพาะ เครื่องมือ `image_generate` ยังใช้
`agents.defaults.imageGenerationModel.timeoutMs` เมื่อการเรียกใช้เครื่องมือไม่ได้
ระบุ timeout ของตัวเอง และเครื่องมือ `image` สำหรับการทำความเข้าใจสื่อจะใช้
`tools.media.image.timeoutSeconds` หรือค่าเริ่มต้นสื่อ 60 วินาที งบเวลาของเครื่องมือ
แบบไดนามิกถูกจำกัดสูงสุดที่ 600000 ms เมื่อหมดเวลา OpenClaw จะยกเลิกสัญญาณ
เครื่องมือเมื่อรองรับ และส่งคืนการตอบกลับเครื่องมือแบบไดนามิกที่ล้มเหลวไปยัง Codex
เพื่อให้ turn ดำเนินต่อได้แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server แบบมีขอบเขต turn ของ Codex แล้ว harness
ยังคาดให้ Codex จบ native turn ด้วย `turn/completed` ด้วย หาก app-server เงียบไปเป็นเวลา
`appServer.turnCompletionIdleTimeoutMs` หลังจากการตอบกลับนั้น OpenClaw จะพยายามขัดจังหวะ
turn ของ Codex แบบ best-effort บันทึก timeout เชิงวินิจฉัย และปล่อยเลนเซสชันของ OpenClaw
เพื่อไม่ให้ข้อความแชตติดตามผลถูกจัดคิวไว้หลัง native turn ที่ค้าง การแจ้งเตือนที่ไม่ใช่สถานะสิ้นสุด
สำหรับ turn เดียวกัน รวมถึง `rawResponseItem/completed` จะปลดอาวุธ watchdog ระยะสั้นนั้น
เพราะ Codex พิสูจน์แล้วว่า turn ยังมีชีวิตอยู่ ส่วน watchdog สถานะสิ้นสุดที่ยาวกว่าจะยังคงป้องกัน
turn ที่ติดค้างจริง การวินิจฉัย timeout จะรวม method การแจ้งเตือน app-server ล่าสุด และสำหรับ
รายการตอบกลับ assistant แบบ raw จะรวมชนิดรายการ, role, id และตัวอย่างข้อความ assistant
แบบจำกัดขนาด

การ override ด้วย environment ยังคงพร้อมใช้สำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้าม binary ที่จัดการไว้เมื่อไม่ได้ตั้งค่า
`appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว ควรใช้ config
สำหรับการปรับใช้ที่ทำซ้ำได้ เพราะทำให้พฤติกรรมของ plugin อยู่ในไฟล์ที่ผ่านการตรวจทานเดียวกันกับ
การตั้งค่า Codex harness ส่วนที่เหลือ

## Native Codex plugins

การรองรับ Native Codex plugin ใช้ความสามารถของแอปและ plugin ของ Codex app-server เอง
ใน thread Codex เดียวกันกับ OpenClaw harness turn OpenClaw ไม่ได้แปล Codex plugin
เป็นเครื่องมือแบบไดนามิกของ OpenClaw แบบสังเคราะห์ `codex_plugin_*`

`codexPlugins` มีผลเฉพาะกับเซสชันที่เลือก native Codex harness เท่านั้น ไม่มีผลกับการรัน PI,
การรัน provider OpenAI ปกติ, binding การสนทนา ACP หรือ harness อื่นๆ

config ที่ย้ายมาแบบขั้นต่ำ:

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

config แอปของ thread จะถูกคำนวณเมื่อ OpenClaw สร้างเซสชัน Codex harness
หรือแทนที่ binding ของ thread Codex ที่ค้าง ไม่ได้คำนวณใหม่ทุก turn
หลังจากเปลี่ยน `codexPlugins` ให้ใช้ `/new`, `/reset` หรือรีสตาร์ท gateway เพื่อให้
เซสชัน Codex harness ในอนาคตเริ่มต้นด้วยชุดแอปที่อัปเดตแล้ว

สำหรับสิทธิ์ในการย้าย, inventory ของแอป, นโยบายการกระทำที่ทำลายข้อมูล,
elicitations และการวินิจฉัย native plugin โปรดดู
[Native Codex plugins](/th/plugins/codex-native-plugins)

## Computer Use

Computer Use ครอบคลุมอยู่ในคู่มือการตั้งค่าของตัวเอง:
[Codex Computer Use](/th/plugins/codex-computer-use)

สรุปสั้นๆ: OpenClaw ไม่ได้ vendor แอปควบคุมเดสก์ท็อปหรือดำเนินการบนเดสก์ท็อปเอง
OpenClaw เตรียม Codex app-server ตรวจสอบว่า MCP server `computer-use` พร้อมใช้งาน
แล้วให้ Codex เป็นเจ้าของการเรียกใช้เครื่องมือ MCP แบบ native ระหว่าง turn ในโหมด Codex

## ขอบเขตรันไทม์

Codex harness เปลี่ยนเฉพาะ executor ของ embedded agent ระดับล่างเท่านั้น

- รองรับเครื่องมือแบบไดนามิกของ OpenClaw Codex ขอให้ OpenClaw ดำเนินการเครื่องมือเหล่านั้น
  ดังนั้น OpenClaw ยังคงอยู่ในเส้นทางการดำเนินการ
- เครื่องมือ shell, patch, MCP และ native app แบบ Codex-native เป็นของ Codex
  OpenClaw สามารถสังเกตหรือบล็อกเหตุการณ์ native บางรายการผ่าน relay ที่รองรับได้
  แต่จะไม่เขียนอาร์กิวเมนต์ของเครื่องมือ native ใหม่
- Codex เป็นเจ้าของ Compaction แบบ native OpenClaw เก็บสำเนา transcript สำหรับประวัติช่องทาง,
  การค้นหา, `/new`, `/reset` และการสลับ model หรือ harness ในอนาคต
- การสร้างสื่อ, การทำความเข้าใจสื่อ, TTS, การอนุมัติ และเอาต์พุตของ messaging-tool
  ยังคงผ่านการตั้งค่า provider/model ของ OpenClaw ที่ตรงกัน
- `tool_result_persist` ใช้กับผลลัพธ์เครื่องมือใน transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่
  record ผลลัพธ์เครื่องมือแบบ Codex-native

สำหรับชั้น hook, surface V1 ที่รองรับ, การจัดการ permission แบบ native, การควบคุมคิว,
กลไกการอัปโหลด feedback ของ Codex และรายละเอียด Compaction โปรดดู
[Codex harness runtime](/th/plugins/codex-harness-runtime)

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็น provider `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ config ใหม่
เลือก model `openai/gpt-*`, เปิดใช้ `plugins.entries.codex.enabled` และตรวจสอบว่า
`plugins.allow` ตัด `codex` ออกหรือไม่

**OpenClaw ใช้ PI แทน Codex:** ตรวจสอบให้แน่ใจว่า model ref เป็น
`openai/gpt-*` บน provider OpenAI อย่างเป็นทางการ และ Codex plugin ติดตั้งและเปิดใช้แล้ว
หากต้องการหลักฐานที่เข้มงวดขณะทดสอบ ให้ตั้งค่า provider หรือ model
`agentRuntime.id: "codex"` รันไทม์ Codex ที่บังคับไว้จะล้มเหลวแทนที่จะ fallback ไปเป็น PI

**config เดิม `openai-codex/*` ยังคงอยู่:** รัน `openclaw doctor --fix`
Doctor จะเขียน model ref เดิมใหม่เป็น `openai/*`, ลบ pin รันไทม์ของเซสชันที่ค้างและทั้ง agent,
และคง override ของ auth-profile ที่มีอยู่ไว้

**app-server ถูกปฏิเสธ:** ใช้ Codex app-server `0.125.0` หรือใหม่กว่า
prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix build เช่น
`0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ OpenClaw ทดสอบ
protocol floor แบบเสถียร `0.125.0`

**`/codex status` เชื่อมต่อไม่ได้:** ตรวจสอบว่า plugin `codex` ที่ bundled ไว้เปิดใช้งานแล้ว,
`plugins.allow` รวม plugin นั้นเมื่อมีการกำหนด allowlist และ `appServer.command`, `url`,
`authToken` หรือ headers ที่กำหนดเองทั้งหมดถูกต้อง

**การค้นพบ model ช้า:** ลดค่า
`plugins.entries.codex.config.discovery.timeoutMs` หรือปิดใช้ discovery ดู
[Codex harness reference](/th/plugins/codex-harness-reference#model-discovery)

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`,
headers และตรวจสอบว่า app-server ระยะไกลใช้ protocol version ของ Codex app-server เดียวกัน

**model ที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่นโยบายรันไทม์ของ provider หรือ model
จะ route ไปยัง harness อื่น provider ref ธรรมดาที่ไม่ใช่ OpenAI จะอยู่บนเส้นทาง provider ปกติ
ในโหมด `auto`

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงานว่า
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ท gateway
เพื่อล้างการลงทะเบียน native hook ที่ค้าง ดู
[Codex Computer Use](/th/plugins/codex-computer-use#troubleshooting)

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
