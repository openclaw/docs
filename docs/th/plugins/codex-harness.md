---
read_when:
    - คุณต้องการใช้ฮาร์เนสเซิร์ฟเวอร์แอปของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าชุดควบคุมของ Codex
    - คุณต้องการให้การปรับใช้ที่ใช้ Codex เท่านั้นล้มเหลวแทนที่จะย้อนกลับไปใช้ PI
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาด้วย
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-05-12T08:46:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่มาพร้อมแพ็กเกจช่วยให้ OpenClaw รันเทิร์นของเอเจนต์ OpenAI แบบฝังตัว
ผ่าน Codex app-server แทน PI harness ในตัว

ใช้ Codex harness เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง:
การ resume เธรดแบบ native, การดำเนินการต่อของเครื่องมือแบบ native, compaction แบบ native และ
การดำเนินการผ่าน app-server OpenClaw ยังเป็นเจ้าของช่องแชท, ไฟล์เซสชัน, การเลือกโมเดล,
OpenClaw dynamic tools, approvals, การส่งสื่อ และสำเนา transcript ที่มองเห็นได้

การตั้งค่าปกติใช้ model refs ของ OpenAI แบบ canonical เช่น `openai/gpt-5.5`
อย่ากำหนดค่า model refs `openai-codex/gpt-*` ใส่ลำดับ auth ของเอเจนต์ OpenAI
ไว้ใต้ `auth.order.openai`; โปรไฟล์ `openai-codex:*` แบบเก่าและ
รายการ `auth.order.openai-codex` ยังคงรองรับสำหรับการติดตั้งที่มีอยู่

OpenClaw เริ่มเธรด Codex app-server ด้วยโหมดโค้ด native ของ Codex และ
เปิดใช้แบบ code-mode-only สิ่งนี้ทำให้ OpenClaw dynamic tools แบบ deferred/searchable
อยู่ภายในพื้นผิวการประมวลผลโค้ดและการค้นหาเครื่องมือของ Codex เอง แทนที่จะเพิ่ม
wrapper การค้นหาเครื่องมือแบบ PI ทับบน Codex

สำหรับภาพรวมที่กว้างขึ้นของการแยกโมเดล/ผู้ให้บริการ/รันไทม์ ให้เริ่มที่
[รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) เวอร์ชันสั้นคือ:
`openai/gpt-5.5` คือ model ref, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` แบบ bundled พร้อมใช้งาน
- หาก config ของคุณใช้ `plugins.allow` ให้รวม `codex`
- Codex app-server `0.125.0` หรือใหม่กว่า Plugin ที่มาพร้อมแพ็กเกจจะจัดการ
  ไบนารี Codex app-server ที่เข้ากันได้โดยค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH`
  จะไม่ส่งผลต่อการเริ่มต้น harness ตามปกติ
- Codex auth พร้อมใช้งานผ่าน `openclaw models auth login --provider openai-codex`,
  บัญชี app-server ใน Codex home ของเอเจนต์ หรือโปรไฟล์ Codex API-key
  auth แบบชัดเจน

สำหรับลำดับความสำคัญของ auth, การแยกสภาพแวดล้อม, คำสั่ง app-server แบบกำหนดเอง, การค้นหาโมเดล
และฟิลด์ config ทั้งหมด โปรดดู
[ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## เริ่มต้นอย่างรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ Codex ใน OpenClaw จะต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครใช้งาน ChatGPT/Codex, เปิดใช้ Plugin `codex` ที่มาพร้อมแพ็กเกจ และใช้
model ref `openai/gpt-*` แบบ canonical

ลงชื่อเข้าใช้ด้วย Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

เปิดใช้ Plugin `codex` ที่มาพร้อมแพ็กเกจ และเลือกโมเดลเอเจนต์ OpenAI:

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

หาก config ของคุณใช้ `plugins.allow` ให้เพิ่ม `codex` ตรงนั้นด้วย:

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

รีสตาร์ท Gateway หลังจากเปลี่ยน config ของ Plugin หากแชทที่มีอยู่มี
เซสชันแล้ว ให้ใช้ `/new` หรือ `/reset` ก่อนทดสอบการเปลี่ยนรันไทม์ เพื่อให้เทิร์นถัดไป
resolve harness จาก config ปัจจุบัน

## การกำหนดค่า

config เริ่มต้นอย่างรวดเร็วคือ config Codex harness ขั้นต่ำที่ใช้งานได้ ตั้งค่าตัวเลือก Codex
harness ใน config ของ OpenClaw และใช้ CLI เฉพาะสำหรับ Codex auth:

| ความต้องการ                                   | ตั้งค่า                                                                              | ที่ใด                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| เปิดใช้ harness                     | `plugins.entries.codex.enabled: true`                                            | config OpenClaw                    |
| รักษาการติดตั้ง Plugin แบบ allowlisted     | รวม `codex` ใน `plugins.allow`                                               | config OpenClaw                    |
| route เทิร์นเอเจนต์ OpenAI ผ่าน Codex | `agents.defaults.model` หรือ `agents.list[].model` เป็น `openai/gpt-*`               | config เอเจนต์ OpenClaw              |
| ลงชื่อเข้าใช้ด้วย Codex OAuth               | `openclaw models auth login --provider openai-codex`                             | โปรไฟล์ CLI auth                   |
| เพิ่ม API-key สำรองสำหรับการรัน Codex      | โปรไฟล์ API-key `openai:*` ที่อยู่หลัง subscription auth ใน `auth.order.openai` | โปรไฟล์ CLI auth + config OpenClaw |
| fail closed เมื่อ Codex ไม่พร้อมใช้งาน  | `agentRuntime.id: "codex"` ของผู้ให้บริการหรือโมเดล                                     | config โมเดล/ผู้ให้บริการ OpenClaw     |
| ใช้ทราฟฟิก OpenAI API โดยตรง          | `agentRuntime.id: "pi"` ของผู้ให้บริการหรือโมเดลพร้อม OpenAI auth ปกติ                | config โมเดล/ผู้ให้บริการ OpenClaw     |
| ปรับแต่งพฤติกรรม app-server               | `plugins.entries.codex.config.appServer.*`                                       | config Plugin Codex                |
| เปิดใช้แอป Plugin native ของ Codex        | `plugins.entries.codex.config.codexPlugins.*`                                    | config Plugin Codex                |
| เปิดใช้ Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | config Plugin Codex                |

ใช้ model refs `openai/gpt-*` สำหรับเทิร์นเอเจนต์ OpenAI ที่มี Codex เป็น backend แนะนำให้ใช้
`auth.order.openai` สำหรับลำดับแบบ subscription-first/API-key-backup โปรไฟล์ auth
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

ในรูปแบบนั้น โปรไฟล์ทั้งสองยังคงรันผ่าน Codex สำหรับเทิร์นเอเจนต์
`openai/gpt-*` API key เป็นเพียง fallback สำหรับ auth ไม่ใช่คำขอให้สลับไปใช้ PI หรือ
OpenAI Responses แบบธรรมดา

ส่วนที่เหลือของหน้านี้ครอบคลุมตัวเลือกทั่วไปที่ผู้ใช้ต้องเลือกระหว่าง:
รูปแบบ deployment, การ routing แบบ fail-closed, นโยบาย guardian approval, Plugin native ของ Codex
และ Computer Use สำหรับรายการตัวเลือกทั้งหมด, ค่าเริ่มต้น, enums, discovery,
การแยกสภาพแวดล้อม, timeouts และฟิลด์ transport ของ app-server โปรดดู
[ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## ตรวจสอบรันไทม์ Codex

ใช้ `/status` ในแชทที่คุณคาดว่าจะเป็น Codex เทิร์นเอเจนต์ OpenAI ที่มี Codex เป็น backend
จะแสดง:

```text
Runtime: OpenAI Codex
```

จากนั้นตรวจสอบสถานะ Codex app-server:

```text
/codex status
/codex models
```

`/codex status` รายงานการเชื่อมต่อ app-server, บัญชี, rate limits, MCP
servers และ skills `/codex models` แสดงแค็ตตาล็อก Codex app-server แบบ live สำหรับ
harness และบัญชี หาก `/status` ไม่เป็นไปตามคาด โปรดดู
[การแก้ปัญหา](#troubleshooting)

## การ routing และการเลือกโมเดล

แยก provider refs และนโยบายรันไทม์ออกจากกัน:

- ใช้ `openai/gpt-*` สำหรับเทิร์นเอเจนต์ OpenAI ผ่าน Codex
- อย่าใช้ `openai-codex/gpt-*` ใน config รัน `openclaw doctor --fix` เพื่อ
  ซ่อม refs แบบ legacy และ session route pins ที่ค้างอยู่
- `agentRuntime.id: "codex"` เป็นตัวเลือกสำหรับโหมด OpenAI อัตโนมัติทั่วไป แต่มีประโยชน์
  เมื่อ deployment ควร fail closed หาก Codex ไม่พร้อมใช้งาน
- `agentRuntime.id: "pi"` เลือกให้ผู้ให้บริการหรือโมเดลใช้พฤติกรรม PI โดยตรงเมื่อ
  ตั้งใจให้เป็นเช่นนั้น
- `/codex ...` ควบคุมการสนทนา Codex app-server แบบ native จากแชท
- ACP/acpx เป็นเส้นทาง harness ภายนอกที่แยกต่างหาก ใช้เฉพาะเมื่อผู้ใช้ขอ
  ACP/acpx หรือ adapter harness ภายนอก

การ routing คำสั่งทั่วไป:

| เจตนาของผู้ใช้                     | ใช้                                     |
| ------------------------------- | --------------------------------------- |
| แนบแชทปัจจุบัน         | `/codex bind [--cwd <path>]`            |
| Resume เธรด Codex ที่มีอยู่ | `/codex resume <thread-id>`             |
| แสดงรายการหรือกรองเธรด Codex    | `/codex threads [filter]`               |
| ส่ง feedback ให้ Codex เท่านั้น        | `/codex diagnostics [note]`             |
| เริ่มงาน ACP/acpx          | คำสั่งเซสชัน ACP/acpx ไม่ใช่ `/codex` |

| กรณีใช้งาน                                             | กำหนดค่า                                                        | ตรวจสอบ                                  | หมายเหตุ                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| การสมัครใช้งาน ChatGPT/Codex พร้อมรันไทม์ Codex native | `openai/gpt-*` พร้อม Plugin `codex` ที่เปิดใช้                       | `/status` แสดง `Runtime: OpenAI Codex` | เส้นทางที่แนะนำ                   |
| Fail closed หาก Codex ไม่พร้อมใช้งาน                  | `agentRuntime.id: "codex"` ของผู้ให้บริการหรือโมเดล                     | เทิร์นล้มเหลวแทนที่จะ fallback ไป PI       | ใช้สำหรับ deployment แบบ Codex-only     |
| ทราฟฟิก OpenAI API-key โดยตรงผ่าน PI             | `agentRuntime.id: "pi"` ของผู้ให้บริการหรือโมเดล และ OpenAI auth ปกติ | `/status` แสดงรันไทม์ PI              | ใช้เฉพาะเมื่อ PI เป็นสิ่งที่ตั้งใจ    |
| config แบบ legacy                                        | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` เขียนใหม่     | อย่าเขียน config ใหม่ด้วยวิธีนี้   |
| adapter Codex แบบ ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                         | สถานะงาน/เซสชัน ACP                 | แยกจาก Codex harness แบบ native |

`agents.defaults.imageModel` ใช้การแบ่ง prefix แบบเดียวกัน ใช้ `openai/gpt-*`
สำหรับ route OpenAI ปกติ และใช้ `codex/gpt-*` เฉพาะเมื่อ image understanding
ควรรันผ่านเทิร์น Codex app-server ที่จำกัดขอบเขต อย่าใช้
`openai-codex/gpt-*`; doctor จะเขียน prefix legacy นั้นใหม่เป็น `openai/gpt-*`

## รูปแบบการ deploy

### deployment Codex พื้นฐาน

ใช้ config เริ่มต้นอย่างรวดเร็วเมื่อเทิร์นเอเจนต์ OpenAI ทั้งหมดควรใช้ Codex เป็น
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

### deployment แบบผู้ให้บริการผสม

รูปแบบนี้คง Claude เป็นเอเจนต์เริ่มต้น และเพิ่มเอเจนต์ Codex ที่มีชื่อ:

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

ด้วย config นี้ เอเจนต์ `main` ใช้เส้นทางผู้ให้บริการปกติของมัน และเอเจนต์
`codex` ใช้ Codex app-server

### deployment Codex แบบ fail-closed

สำหรับเทิร์นเอเจนต์ OpenAI, `openai/gpt-*` จะ resolve เป็น Codex อยู่แล้วเมื่อ
Plugin ที่มาพร้อมแพ็กเกจพร้อมใช้งาน เพิ่มนโยบายรันไทม์แบบชัดเจนเมื่อคุณต้องการกฎ
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

เมื่อบังคับใช้ Codex, OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Plugin Codex ถูกปิดใช้,
app-server เก่าเกินไป หรือ app-server ไม่สามารถเริ่มได้

## นโยบาย app-server

โดยค่าเริ่มต้น Plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการไว้ในเครื่องด้วย stdio
transport ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจต้องการรัน
executable อื่น ใช้ WebSocket transport เฉพาะเมื่อ app-server กำลังรันอยู่ที่อื่นแล้ว:

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

เซสชัน app-server `stdio` ในเครื่องมีค่าเริ่มต้นเป็นท่าทีของผู้ปฏิบัติการในเครื่องที่เชื่อถือได้:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` หากข้อกำหนดของ Codex ในเครื่องไม่อนุญาตท่าที YOLO
โดยนัยนั้น OpenClaw จะเลือกสิทธิ์ guardian ที่อนุญาตแทน
เมื่อ sandbox ของ OpenClaw ทำงานอยู่สำหรับเซสชัน OpenClaw จะจำกัด Codex
`danger-full-access` ให้เป็น Codex `workspace-write` เพื่อให้รอบการทำงาน code-mode
แบบ native ของ Codex อยู่ภายในเวิร์กสเปซที่ถูก sandbox

ใช้โหมด guardian เมื่อคุณต้องการ auto-review แบบ native ของ Codex ก่อนการออกจาก sandbox
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
`sandbox: "workspace-write"` เมื่อข้อกำหนดในเครื่องอนุญาตค่าเหล่านั้น

สำหรับทุกฟิลด์ของ app-server, ลำดับ auth, การแยกสภาพแวดล้อม, การค้นพบ และ
พฤติกรรม timeout โปรดดู [ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## คำสั่งและการวินิจฉัย

Plugin ที่บันเดิลมาจะลงทะเบียน `/codex` เป็นคำสั่ง slash บนช่องทางใดก็ตามที่
รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` ตรวจสอบการเชื่อมต่อ app-server, โมเดล, บัญชี, rate limits,
  เซิร์ฟเวอร์ MCP และ skills
- `/codex models` แสดงรายการโมเดล app-server ของ Codex ที่ใช้งานอยู่
- `/codex threads [filter]` แสดงรายการ thread app-server ของ Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับ
  thread Codex ที่มีอยู่
- `/codex compact` ขอให้ app-server ของ Codex compact thread ที่แนบอยู่
- `/codex review` เริ่ม review แบบ native ของ Codex สำหรับ thread ที่แนบอยู่
- `/codex diagnostics [note]` ถามก่อนส่ง feedback ของ Codex สำหรับ
  thread ที่แนบอยู่
- `/codex account` แสดงสถานะบัญชีและ rate-limit
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของ app-server Codex
- `/codex skills` แสดงรายการ skills ของ app-server Codex

สำหรับรายงานสนับสนุนส่วนใหญ่ ให้เริ่มด้วย `/diagnostics [note]` ในบทสนทนา
ที่เกิดบั๊กขึ้น คำสั่งนี้จะสร้างรายงาน diagnostics ของ Gateway หนึ่งรายการ และสำหรับเซสชัน
Codex harness จะขออนุมัติเพื่อส่งชุด feedback ของ Codex ที่เกี่ยวข้อง
โปรดดู [การส่งออก diagnostics](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรม
group chat

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลด feedback ของ Codex
สำหรับ thread ที่แนบอยู่ในปัจจุบันโดยเฉพาะ โดยไม่รวมชุด diagnostics ของ Gateway แบบเต็ม

### ตรวจสอบ thread ของ Codex ในเครื่อง

วิธีที่เร็วที่สุดในการตรวจสอบการรัน Codex ที่มีปัญหามักเป็นการเปิด thread Codex
แบบ native โดยตรง:

```bash
codex resume <thread-id>
```

รับ thread id จากคำตอบ `/diagnostics` ที่เสร็จสิ้นแล้ว, `/codex binding` หรือ
`/codex threads [filter]`

สำหรับกลไกการอัปโหลดและขอบเขต diagnostics ระดับ runtime โปรดดู
[Codex harness runtime](/th/plugins/codex-harness-runtime#codex-feedback-upload)

auth จะถูกเลือกตามลำดับนี้:

1. โปรไฟล์ auth ของ OpenAI ที่เรียงลำดับไว้สำหรับ agent โดยควรอยู่ใต้
   `auth.order.openai` id โปรไฟล์ `openai-codex:*` ที่มีอยู่ยังคงใช้งานได้
2. บัญชีที่มีอยู่ของ app-server ใน Codex home ของ agent นั้น
3. สำหรับการเปิด app-server `stdio` ในเครื่องเท่านั้น `CODEX_API_KEY` จากนั้น
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้ auth ของ OpenAI

เมื่อ OpenClaw พบโปรไฟล์ auth ของ Codex แบบการสมัครสมาชิก ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากโปรเซสลูก Codex ที่ถูก spawn
การทำเช่นนี้ทำให้คีย์ API ระดับ Gateway ยังพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้รอบการทำงาน app-server แบบ native ของ Codex ถูกคิดค่าใช้จ่ายผ่าน API โดยไม่ตั้งใจ
โปรไฟล์ API-key ของ Codex ที่ระบุชัดเจนและ fallback env-key ของ `stdio` ในเครื่องจะใช้การล็อกอิน app-server
แทน env ของโปรเซสลูกที่สืบทอดมา การเชื่อมต่อ app-server แบบ WebSocket
จะไม่ได้รับ fallback API-key จาก env ของ Gateway ให้ใช้โปรไฟล์ auth ที่ระบุชัดเจนหรือบัญชีของ
app-server ระยะไกลเอง

หากโปรไฟล์การสมัครสมาชิกชนกับขีดจำกัดการใช้งานของ Codex, OpenClaw จะบันทึกเวลา reset
เมื่อ Codex รายงาน และลองโปรไฟล์ auth ถัดไปตามลำดับสำหรับการรัน Codex เดียวกัน
เมื่อเวลาที่ reset ผ่านไป โปรไฟล์การสมัครสมาชิกจะกลับมาใช้ได้อีกครั้ง
โดยไม่เปลี่ยนโมเดล `openai/gpt-*` หรือ runtime ของ Codex ที่เลือกไว้

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

`appServer.clearEnv` มีผลเฉพาะกับโปรเซสลูก app-server ของ Codex ที่ถูก spawn

เครื่องมือ dynamic ของ Codex มีค่าเริ่มต้นเป็นการโหลดแบบ `searchable` OpenClaw จะไม่เปิดเผย
เครื่องมือ dynamic ที่ซ้ำกับการดำเนินการเวิร์กสเปซแบบ native ของ Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` และ `update_plan` เครื่องมือผสานรวม OpenClaw
ที่เหลือ เช่น messaging, sessions, media, Cron, browser, nodes,
Gateway, `heartbeat_respond` และ `web_search` มีให้ใช้ผ่านการค้นหาเครื่องมือของ Codex
ใต้ namespace `openclaw` ทำให้ context เริ่มต้นของโมเดลเล็กลง
`sessions_yield` และการตอบกลับ source แบบ message-tool-only ยังคงเป็นแบบ direct เพราะสิ่งเหล่านี้
เป็นสัญญา turn-control คำแนะนำการทำงานร่วมกันของ Heartbeat จะบอกให้ Codex
ค้นหา `heartbeat_respond` ก่อนจบรอบการทำงาน heartbeat เมื่อเครื่องมือนั้น
ยังไม่ได้ถูกโหลด

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับ app-server Codex
แบบกำหนดเองที่ไม่สามารถค้นหาเครื่องมือ dynamic ที่เลื่อนไว้ได้ หรือเมื่อ debug payload
เครื่องมือแบบเต็ม

ฟิลด์ Plugin Codex ระดับบนที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น        | ความหมาย                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | ใช้ `"direct"` เพื่อใส่เครื่องมือ dynamic ของ OpenClaw ลงใน context เครื่องมือ Codex เริ่มต้นโดยตรง |
| `codexDynamicToolsExclude` | `[]`           | ชื่อเครื่องมือ dynamic ของ OpenClaw เพิ่มเติมที่จะละเว้นจากรอบการทำงาน app-server ของ Codex              |
| `codexPlugins`             | ปิดใช้งาน       | การรองรับ Plugin/app แบบ native ของ Codex สำหรับ Plugin ที่ curated แบบ source-installed ที่ย้ายแล้ว           |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` จะ spawn Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                                |
| `command`                     | ไบนารี Codex ที่จัดการให้                                   | ไฟล์ปฏิบัติการสำหรับ transport แบบ stdio เว้นว่างไว้เพื่อใช้ไบนารีที่จัดการให้; ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับ transport แบบ stdio                                                                                                                                                                                                          |
| `url`                         | ไม่ได้ตั้งค่า                                                  | URL ของ app-server แบบ WebSocket                                                                                                                                                                                                               |
| `authToken`                   | ไม่ได้ตั้งค่า                                                  | Bearer token สำหรับ transport แบบ WebSocket                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | header เพิ่มเติมของ WebSocket                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากโปรเซส app-server แบบ stdio ที่ถูก spawn หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว `CODEX_HOME` และ `HOME` ถูกสงวนไว้สำหรับการแยก Codex ต่อ agent ของ OpenClaw ในการเปิดใช้งานในเครื่อง    |
| `requestTimeoutMs`            | `60000`                                                | Timeout สำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | หน้าต่างเงียบหลังจากคำขอ app-server ของ Codex ในขอบเขตรอบการทำงาน ขณะที่ OpenClaw รอ `turn/completed` เพิ่มค่านี้สำหรับเฟส synthesis หลังใช้เครื่องมือหรือแบบ status-only ที่ช้า                                                                     |
| `mode`                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ในเครื่องไม่อนุญาต YOLO | preset สำหรับการดำเนินการแบบ YOLO หรือที่ผ่านการ review โดย guardian ข้อกำหนด `stdio` ในเครื่องที่ไม่รวม `danger-full-access`, การอนุมัติ `never` หรือ reviewer `user` จะทำให้ค่าเริ่มต้นโดยนัยเป็น guardian                                                   |
| `approvalPolicy`              | `"never"` หรือนโยบายการอนุมัติ guardian ที่อนุญาต       | นโยบายการอนุมัติแบบ native ของ Codex ที่ส่งไปยัง thread start/resume/turn ค่าเริ่มต้นของ guardian จะเลือก `"on-request"` เมื่ออนุญาต                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` หรือ sandbox guardian ที่อนุญาต  | โหมด sandbox แบบ native ของ Codex ที่ส่งไปยัง thread start/resume ค่าเริ่มต้นของ guardian จะเลือก `"workspace-write"` เมื่ออนุญาต มิฉะนั้นจะใช้ `"read-only"` เมื่อ sandbox ของ OpenClaw ทำงานอยู่ `danger-full-access` จะถูกจำกัดให้เป็น `"workspace-write"` |
| `approvalsReviewer`           | `"user"` หรือ reviewer guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex review prompt การอนุมัติแบบ native เมื่ออนุญาต มิฉะนั้นใช้ `guardian_subagent` หรือ `user` `guardian_subagent` ยังคงเป็น alias แบบ legacy                                                                      |
| `serviceTier`                 | ไม่ได้ตั้งค่า                                                  | service tier ของ app-server Codex แบบไม่บังคับ `"priority"` เปิดใช้การกำหนดเส้นทาง fast-mode, `"flex"` ขอการประมวลผลแบบ flex, `null` ล้าง override และ legacy `"fast"` จะยอมรับเป็น `"priority"`                                         |

การเรียกใช้เครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกต่างหากจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` ใช้ watchdog ของ
OpenClaw 30 วินาทีโดยค่าเริ่มต้น อาร์กิวเมนต์ `timeoutMs` แบบต่อการเรียกที่มีค่าเป็นบวกจะขยาย
หรือย่นงบเวลาของเครื่องมือนั้นโดยเฉพาะ เครื่องมือ `image_generate` ยังใช้
`agents.defaults.imageGenerationModel.timeoutMs` เมื่อการเรียกเครื่องมือไม่ได้
ระบุ timeout ของตัวเอง และเครื่องมือ `image` สำหรับการทำความเข้าใจสื่อใช้
`tools.media.image.timeoutSeconds` หรือค่าเริ่มต้นสื่อ 60 วินาที งบเวลาเครื่องมือแบบไดนามิก
ถูกจำกัดสูงสุดที่ 600000 ms เมื่อ timeout, OpenClaw จะยกเลิกสัญญาณเครื่องมือ
ในที่ที่รองรับ และส่งคืนการตอบกลับ dynamic-tool ที่ล้มเหลวไปยัง Codex เพื่อให้เทิร์น
ดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก OpenClaw ตอบกลับคำขอ app-server ที่ผูกกับเทิร์นของ Codex แล้ว harness
ยังคาดให้ Codex จบเทิร์น native ด้วย `turn/completed` ด้วย หาก
app-server เงียบไปเป็นเวลา `appServer.turnCompletionIdleTimeoutMs` หลังจาก
การตอบกลับนั้น OpenClaw จะพยายามขัดจังหวะเทิร์น Codex แบบ best-effort, บันทึก diagnostic
timeout, และปล่อยเลนเซสชันของ OpenClaw เพื่อให้ข้อความแชตถัดไป
ไม่ถูกเข้าคิวตามหลังเทิร์น native ที่ค้างอยู่ การแจ้งเตือนแบบ non-terminal ใด ๆ สำหรับ
เทิร์นเดียวกัน รวมถึง `rawResponseItem/completed`, จะปลด watchdog ระยะสั้นนั้น
เพราะ Codex ได้พิสูจน์แล้วว่าเทิร์นยังมีชีวิตอยู่; watchdog แบบ terminal ที่ยาวกว่า
ยังคงป้องกันเทิร์นที่ค้างจริง ๆ การแจ้งเตือน app-server แบบ global
เช่น การอัปเดต rate-limit จะไม่รีเซ็ตความคืบหน้า turn-idle เมื่อ Codex ส่ง
รายการ `agentMessage` ที่ completed แล้วเงียบไปโดยไม่มี `turn/completed`,
OpenClaw จะถือว่าเอาต์พุตของ assistant เสร็จสมบูรณ์ในทางปฏิบัติ, พยายาม
ขัดจังหวะเทิร์น Codex native แบบ best-effort, และปล่อยเลนเซสชัน Diagnostic
timeout จะรวมเมธอดการแจ้งเตือน app-server ล่าสุด และสำหรับรายการ raw
assistant response จะรวมชนิดรายการ, role, id, และตัวอย่างข้อความ assistant
ที่จำกัดขนาด

Environment overrides ยังคงมีให้ใช้สำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ข้าม binary ที่จัดการไว้เมื่อ
ไม่ได้ตั้งค่า `appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกนำออกแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว แนะนำให้ใช้ config
สำหรับ deployment ที่ทำซ้ำได้ เพราะเก็บพฤติกรรม Plugin ไว้ใน
ไฟล์ที่ผ่านการรีวิวเดียวกับการตั้งค่า Codex harness ส่วนที่เหลือ

## Plugin native ของ Codex

การรองรับ Plugin native ของ Codex ใช้ความสามารถ app และ plugin ของ Codex app-server เอง
ในเธรด Codex เดียวกับเทิร์น OpenClaw harness OpenClaw
ไม่แปลง Plugin ของ Codex เป็นเครื่องมือแบบไดนามิก OpenClaw สังเคราะห์ชื่อ `codex_plugin_*`

`codexPlugins` มีผลเฉพาะกับเซสชันที่เลือก native Codex harness เท่านั้น ไม่มี
ผลต่อการรัน PI, การรัน provider OpenAI ปกติ, การผูก conversation ของ ACP,
หรือ harness อื่น ๆ

Config ที่ migrate แล้วแบบน้อยที่สุด:

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

Config ของ thread app ถูกคำนวณเมื่อ OpenClaw สร้างเซสชัน Codex harness
หรือแทนที่การผูกเธรด Codex ที่ค้างอยู่ จะไม่คำนวณใหม่ในทุกเทิร์น
หลังจากเปลี่ยน `codexPlugins` ให้ใช้ `/new`, `/reset`, หรือรีสตาร์ต gateway เพื่อให้
เซสชัน Codex harness ในอนาคตเริ่มด้วยชุด app ที่อัปเดตแล้ว

สำหรับ eligibility ของ migration, inventory ของ app, policy สำหรับ destructive action,
elicitations, และ diagnostics ของ native plugin โปรดดู
[Plugin native ของ Codex](/th/plugins/codex-native-plugins)

## Computer Use

Computer Use ครอบคลุมอยู่ในคู่มือการตั้งค่าของตัวเอง:
[Codex Computer Use](/th/plugins/codex-computer-use)

สรุปสั้น ๆ: OpenClaw ไม่ vendor แอป desktop-control หรือ execute
desktop actions เอง แต่เตรียม Codex app-server, ตรวจสอบว่า
MCP server `computer-use` พร้อมใช้งาน, แล้วให้ Codex เป็นเจ้าของการเรียกใช้เครื่องมือ MCP
native ระหว่างเทิร์น Codex-mode

## ขอบเขต runtime

Codex harness เปลี่ยนเฉพาะตัว executor ของ agent แบบฝังตัวระดับล่างเท่านั้น

- รองรับเครื่องมือแบบไดนามิกของ OpenClaw Codex ขอให้ OpenClaw execute
  เครื่องมือเหล่านั้น ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการ execute
- เครื่องมือ shell, patch, MCP, และ native app แบบ Codex-native เป็นของ Codex
  OpenClaw สามารถสังเกตหรือบล็อกเหตุการณ์ native บางรายการผ่าน relay ที่รองรับ
  แต่จะไม่เขียนอาร์กิวเมนต์ของเครื่องมือ native ใหม่
- Codex เป็นเจ้าของ Compaction native OpenClaw เก็บสำเนา transcript mirror สำหรับประวัติ
  channel, search, `/new`, `/reset`, และการสลับ model หรือ harness ในอนาคต
- การสร้างสื่อ, การทำความเข้าใจสื่อ, TTS, approvals, และเอาต์พุต messaging-tool
  ยังคงผ่านการตั้งค่า provider/model ของ OpenClaw ที่ตรงกัน
- `tool_result_persist` ใช้กับผลลัพธ์เครื่องมือ transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่
  record ผลลัพธ์เครื่องมือแบบ Codex-native

สำหรับ hook layers, surface V1 ที่รองรับ, การจัดการ permission แบบ native, การบังคับทิศทางคิว,
กลไกการอัปโหลด feedback ของ Codex, และรายละเอียด Compaction โปรดดู
[Codex harness runtime](/th/plugins/codex-harness-runtime)

## การแก้ปัญหา

**Codex ไม่ปรากฏเป็น provider `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ
config ใหม่ เลือก model `openai/gpt-*`, เปิดใช้
`plugins.entries.codex.enabled`, และตรวจสอบว่า `plugins.allow` ตัด
`codex` ออกหรือไม่

**OpenClaw ใช้ PI แทน Codex:** ตรวจให้แน่ใจว่า model ref เป็น
`openai/gpt-*` บน provider OpenAI อย่างเป็นทางการ และ Codex plugin
ติดตั้งและเปิดใช้งานแล้ว หากต้องการหลักฐานที่เข้มงวดระหว่างทดสอบ ให้ตั้ง provider หรือ
model `agentRuntime.id: "codex"` runtime Codex ที่ถูกบังคับจะล้มเหลวแทน
การ fallback ไปที่ PI

**Config legacy `openai-codex/*` ยังคงอยู่:** รัน `openclaw doctor --fix`
Doctor เขียน model refs legacy ใหม่เป็น `openai/*`, ลบ session และ
runtime pins ทั้ง agent ที่ค้างอยู่, และรักษา auth-profile overrides เดิมไว้

**app-server ถูกปฏิเสธ:** ใช้ Codex app-server `0.125.0` หรือใหม่กว่า
Prereleases เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix ของ build เช่น
`0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ OpenClaw ทดสอบ
stable protocol floor `0.125.0`

**`/codex status` เชื่อมต่อไม่ได้:** ตรวจว่า Plugin `codex` ที่ bundle มา
เปิดใช้งานอยู่, `plugins.allow` รวมไว้เมื่อมีการกำหนด allowlist, และ
`appServer.command`, `url`, `authToken`, หรือ headers แบบกำหนดเองถูกต้อง

**Model discovery ช้า:** ลด
`plugins.entries.codex.config.discovery.timeoutMs` หรือปิด discovery ดู
[Codex harness reference](/th/plugins/codex-harness-reference#model-discovery)

**WebSocket transport ล้มเหลวทันที:** ตรวจ `appServer.url`, `authToken`,
headers, และ remote app-server ใช้ protocol version ของ Codex app-server
เดียวกัน

**Model ที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่ policy runtime ของ provider หรือ model
จะ route ไปยัง harness อื่น Provider refs ที่ไม่ใช่ OpenAI แบบปกติจะอยู่บน
เส้นทาง provider ปกติในโหมด `auto`

**ติดตั้ง Computer Use แล้ว แต่เครื่องมือไม่ทำงาน:** ตรวจ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงาน
`Native hook relay unavailable` ให้ใช้ `/new` หรือ `/reset`; หากยังคงอยู่ ให้รีสตาร์ต
gateway เพื่อล้างการลงทะเบียน native hook ที่ค้างอยู่ ดู
[Codex Computer Use](/th/plugins/codex-computer-use#troubleshooting)

## ที่เกี่ยวข้อง

- [Codex harness reference](/th/plugins/codex-harness-reference)
- [Codex harness runtime](/th/plugins/codex-harness-runtime)
- [Plugin native ของ Codex](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [Agent runtimes](/th/concepts/agent-runtimes)
- [Model providers](/th/concepts/model-providers)
- [OpenAI provider](/th/providers/openai)
- [Agent harness plugins](/th/plugins/sdk-agent-harness)
- [Plugin hooks](/th/plugins/hooks)
- [Diagnostics export](/th/gateway/diagnostics)
- [Status](/th/cli/status)
- [Testing](/th/help/testing-live#live-codex-app-server-harness-smoke)
