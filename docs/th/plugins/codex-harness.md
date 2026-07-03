---
read_when:
    - คุณต้องการใช้ชุดทดสอบ app-server ของ Codex ที่มาพร้อมกัน
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนสของ Codex
    - คุณต้องการให้การปรับใช้แบบ Codex-only ล้มเหลวแทนที่จะย้อนกลับไปใช้ OpenClaw
summary: เรียกใช้เทิร์นของเอเจนต์แบบฝังของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาให้
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-07-03T17:47:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่บันเดิลมาช่วยให้ OpenClaw รันเทิร์นของเอเจนต์ OpenAI แบบฝังตัว
ผ่าน Codex app-server แทน harness ในตัวของ OpenClaw

ใช้ Codex harness เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง:
การ resume เธรดแบบ native, การดำเนินเครื่องมือต่อแบบ native, compaction แบบ native และ
การทำงานผ่าน app-server OpenClaw ยังคงเป็นเจ้าของช่องทางแชต, ไฟล์เซสชัน, การเลือกโมเดล,
เครื่องมือไดนามิกของ OpenClaw, approvals, การส่งสื่อ และสำเนา transcript ที่มองเห็นได้

การตั้งค่าปกติใช้ refs โมเดล OpenAI แบบ canonical เช่น `openai/gpt-5.5`
อย่ากำหนดค่า refs GPT ของ Codex แบบ legacy ใส่ลำดับ auth ของเอเจนต์ OpenAI
ไว้ใต้ `auth.order.openai`; ids โปรไฟล์ auth ของ Codex แบบ legacy ที่เก่ากว่าและ
รายการลำดับ auth ของ Codex แบบ legacy คือสถานะ legacy ที่ซ่อมโดย
`openclaw doctor --fix`

เมื่อไม่มี sandbox ของ OpenClaw ที่ active อยู่ OpenClaw จะเริ่มเธรด Codex app-server
โดยเปิดใช้โหมดโค้ด native ของ Codex ขณะยังปิด code-mode-only ไว้เป็นค่าเริ่มต้น
สิ่งนี้ทำให้ workspace native และความสามารถด้านโค้ดของ Codex ยังพร้อมใช้งาน ขณะที่
เครื่องมือไดนามิกของ OpenClaw ยังคงผ่านบริดจ์ `item/tool/call` ของ app-server
sandboxing ของ OpenClaw ที่ active และนโยบายเครื่องมือแบบจำกัดจะปิดโหมดโค้ด native
ทั้งหมด เว้นแต่คุณจะเลือกใช้เส้นทาง sandbox exec-server แบบทดลอง

ฟีเจอร์ Codex-native นี้แยกจาก
[โหมดโค้ดของ OpenClaw](/th/reference/code-mode) ซึ่งเป็น runtime QuickJS-WASI
แบบ opt-in สำหรับการรัน OpenClaw ทั่วไปที่มีรูปแบบอินพุต `exec` ต่างกัน

สำหรับภาพรวมการแบ่งโมเดล/provider/runtime ที่กว้างกว่า ให้เริ่มที่
[Runtime ของเอเจนต์](/th/concepts/agent-runtimes) เวอร์ชันย่อคือ:
`openai/gpt-5.5` คือ ref โมเดล, `codex` คือ runtime และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## ข้อกำหนด

- OpenClaw พร้อม Plugin `codex` ที่บันเดิลและพร้อมใช้งาน
- หาก config ของคุณใช้ `plugins.allow` ให้รวม `codex`
- Codex app-server `0.125.0` หรือใหม่กว่า Plugin ที่บันเดิลจะจัดการไบนารี
  Codex app-server ที่เข้ากันได้ตามค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH` จะไม่
  ส่งผลต่อการเริ่ม harness ตามปกติ
- มี auth ของ Codex ผ่าน `openclaw models auth login --provider openai`,
  บัญชี app-server ใน Codex home ของเอเจนต์ หรือโปรไฟล์ auth แบบ API-key
  ของ Codex ที่ระบุชัดเจน

สำหรับลำดับความสำคัญของ auth, การแยก environment, คำสั่ง app-server แบบกำหนดเอง, การค้นพบโมเดล
และฟิลด์ config ทั้งหมด โปรดดู
[เอกสารอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## เริ่มต้นอย่างรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ Codex ใน OpenClaw ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครใช้งาน ChatGPT/Codex, เปิดใช้ Plugin `codex` ที่บันเดิล และใช้
ref โมเดล `openai/gpt-*` แบบ canonical

ลงชื่อเข้าใช้ด้วย Codex OAuth:

```bash
openclaw models auth login --provider openai
```

เปิดใช้ Plugin `codex` ที่บันเดิลและเลือกโมเดลเอเจนต์ OpenAI:

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

รีสตาร์ท gateway หลังเปลี่ยน config ของ Plugin หากแชตที่มีอยู่มีเซสชันแล้ว
ให้ใช้ `/new` หรือ `/reset` ก่อนทดสอบการเปลี่ยน runtime เพื่อให้เทิร์นถัดไป
resolve harness จาก config ปัจจุบัน

## การกำหนดค่า

config เริ่มต้นอย่างรวดเร็วคือ config Codex harness ขั้นต่ำที่ใช้งานได้ ตั้งค่าตัวเลือก Codex
harness ใน config ของ OpenClaw และใช้ CLI สำหรับ auth ของ Codex เท่านั้น:

| ความต้องการ | ตั้งค่า | ที่ไหน |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| เปิดใช้ harness | `plugins.entries.codex.enabled: true` | config ของ OpenClaw |
| เก็บการติดตั้ง Plugin ที่อยู่ใน allowlist | รวม `codex` ใน `plugins.allow` | config ของ OpenClaw |
| Route เทิร์นเอเจนต์ OpenAI ผ่าน Codex | `agents.defaults.model` หรือ `agents.list[].model` เป็น `openai/gpt-*` | config เอเจนต์ OpenClaw |
| ลงชื่อเข้าใช้ด้วย ChatGPT/Codex OAuth | `openclaw models auth login --provider openai` | โปรไฟล์ auth ของ CLI |
| เพิ่ม API-key สำรองสำหรับการรัน Codex | โปรไฟล์ API-key `openai:*` ที่ระบุหลัง auth แบบสมัครใช้งานใน `auth.order.openai` | โปรไฟล์ auth ของ CLI + config ของ OpenClaw |
| fail closed เมื่อ Codex ไม่พร้อมใช้งาน | Provider หรือโมเดล `agentRuntime.id: "codex"` | config โมเดล/provider ของ OpenClaw |
| ใช้ทราฟฟิก OpenAI API โดยตรง | Provider หรือโมเดล `agentRuntime.id: "openclaw"` พร้อม auth OpenAI ปกติ | config โมเดล/provider ของ OpenClaw |
| ปรับพฤติกรรม app-server | `plugins.entries.codex.config.appServer.*` | config Plugin Codex |
| เปิดใช้แอป Plugin native ของ Codex | `plugins.entries.codex.config.codexPlugins.*` | config Plugin Codex |
| เปิดใช้ Codex Computer Use | `plugins.entries.codex.config.computerUse.*` | config Plugin Codex |

ใช้ refs โมเดล `openai/gpt-*` สำหรับเทิร์นเอเจนต์ OpenAI ที่มี Codex หนุนหลัง ควรใช้
`auth.order.openai` สำหรับลำดับ subscription-first/API-key-backup ids โปรไฟล์ auth
ของ Codex แบบ legacy ที่มีอยู่และลำดับ auth ของ Codex แบบ legacy เป็นสถานะ legacy
สำหรับ doctor เท่านั้น; อย่าเขียน refs GPT ของ Codex แบบ legacy ใหม่

อย่าตั้ง `compaction.model` หรือ `compaction.provider` บนเอเจนต์ที่มี Codex หนุนหลัง
Codex ทำ compaction ผ่านสถานะเธรด app-server native ของตัวเอง ดังนั้น OpenClaw จะเพิกเฉย
ต่อการ override summarizer ภายในเครื่องเหล่านั้นตอน runtime และ `openclaw doctor --fix` จะลบ
สิ่งเหล่านั้นเมื่อเอเจนต์ใช้ Codex

Lossless ยังคงรองรับเป็น context engine สำหรับ assembly, ingestion และ
maintenance รอบเทิร์นของ Codex กำหนดค่าผ่าน
`plugins.slots.contextEngine: "lossless-claw"` และ
`plugins.entries.lossless-claw.config.summaryModel` ไม่ใช่ผ่าน
`agents.defaults.compaction.provider` `openclaw doctor --fix` จะย้ายรูปแบบเก่า
`compaction.provider: "lossless-claw"` ไปยังสล็อต context-engine ของ Lossless
เมื่อ Codex เป็น runtime ที่ active แต่ Codex native ยังคงเป็นเจ้าของ compaction

Codex app-server harness แบบ native รองรับ context engine ที่ต้องการ
pre-prompt assembly แบ็กเอนด์ CLI ทั่วไป รวมถึง `codex-cli` ไม่มี
ความสามารถของ host นี้

สำหรับเอเจนต์ที่มี Codex หนุนหลัง `/compact` จะเริ่ม compaction ของ Codex app-server native บน
เธรดที่ bind ไว้ OpenClaw จะไม่รอให้เสร็จ, ไม่กำหนด timeout ของ OpenClaw,
ไม่รีสตาร์ท app-server ที่แชร์อยู่ หรือ fallback ไปยัง context-engine หรือ
summarizer OpenAI สาธารณะ หาก binding เธรด native ของ Codex หายไปหรือ
เก่า คำสั่งจะ fail closed เพื่อให้ operator เห็นขอบเขต runtime จริง
แทนที่จะสลับ backend compaction อย่างเงียบๆ

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ในรูปแบบนั้น ทั้งสองโปรไฟล์ยังคงรันผ่าน Codex สำหรับเทิร์นเอเจนต์
`openai/gpt-*` API key เป็นเพียง fallback ของ auth ไม่ใช่คำขอให้สลับไปใช้ OpenClaw หรือ
OpenAI Responses แบบปกติ

ส่วนที่เหลือของหน้านี้ครอบคลุม variant ทั่วไปที่ผู้ใช้ต้องเลือกระหว่าง:
รูปแบบ deployment, การ route แบบ fail-closed, นโยบาย approval ของ guardian, Plugin
native ของ Codex และ Computer Use สำหรับรายการตัวเลือกทั้งหมด, ค่าเริ่มต้น, enums, discovery,
การแยก environment, timeouts และฟิลด์ transport ของ app-server โปรดดู
[เอกสารอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## ตรวจสอบ runtime ของ Codex

ใช้ `/status` ในแชตที่คุณคาดว่าจะใช้ Codex เทิร์นเอเจนต์ OpenAI ที่มี Codex หนุนหลัง
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
servers และ skills `/codex models` แสดง catalog Codex app-server แบบ live สำหรับ
harness และบัญชี หาก `/status` ให้ผลที่ไม่คาดคิด โปรดดู
[การแก้ไขปัญหา](#troubleshooting)

## การ route และการเลือกโมเดล

แยก refs ของ provider และนโยบาย runtime ออกจากกัน:

- ใช้ `openai/gpt-*` สำหรับเทิร์นเอเจนต์ OpenAI ผ่าน Codex
- อย่าใช้ refs GPT ของ Codex แบบ legacy ใน config รัน `openclaw doctor --fix` เพื่อ
  ซ่อม refs แบบ legacy และ route pins ของเซสชันที่เก่า
- `agentRuntime.id: "codex"` เป็นตัวเลือกสำหรับโหมด OpenAI auto ปกติ แต่มีประโยชน์
  เมื่อ deployment ควร fail closed หาก Codex ไม่พร้อมใช้งาน
- `agentRuntime.id: "openclaw"` opt in provider หรือโมเดลเข้าสู่ runtime แบบฝังตัวของ OpenClaw
  เมื่อมีเจตนาเช่นนั้น
- `/codex ...` ควบคุมการสนทนา Codex app-server native จากแชต
- ACP/acpx เป็นเส้นทาง harness ภายนอกที่แยกต่างหาก ใช้เฉพาะเมื่อผู้ใช้ขอ
  ACP/acpx หรือ adapter harness ภายนอก

การ route คำสั่งทั่วไป:

| เจตนาของผู้ใช้ | ใช้ |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| แนบแชตปัจจุบัน | `/codex bind [--cwd <path>]` |
| Resume เธรด Codex ที่มีอยู่ | `/codex resume <thread-id>` |
| แสดงรายการหรือกรองเธรด Codex | `/codex threads [filter]` |
| แสดงรายการ Plugin native ของ Codex | `/codex plugins list` |
| เปิดหรือปิด Plugin native ของ Codex ที่กำหนดค่าไว้ | `/codex plugins enable <name>`, `/codex plugins disable <name>` |
| แนบเซสชัน Codex CLI ที่มีอยู่บน node ที่จับคู่ไว้ | `/codex sessions --host <node> [filter]`, แล้ว `/codex resume <session-id> --host <node> --bind here` |
| ส่ง feedback ของ Codex เท่านั้น | `/codex diagnostics [note]` |
| เริ่มงาน ACP/acpx | คำสั่งเซสชัน ACP/acpx ไม่ใช่ `/codex` |

| กรณีการใช้งาน                                             | กำหนดค่า                                                              | ตรวจสอบ                                  | หมายเหตุ                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| การสมัครใช้งาน ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-*` พร้อมเปิดใช้ `codex` plugin                             | `/status` แสดง `Runtime: OpenAI Codex` | เส้นทางที่แนะนำ                      |
| ล้มเหลวแบบปิดหาก Codex ไม่พร้อมใช้งาน                  | Provider หรือโมเดล `agentRuntime.id: "codex"`                           | เทิร์นล้มเหลวแทนการใช้ fallback แบบฝัง | ใช้สำหรับการปรับใช้ที่ใช้ Codex เท่านั้น        |
| ส่งทราฟฟิก OpenAI API-key โดยตรงผ่าน OpenClaw       | Provider หรือโมเดล `agentRuntime.id: "openclaw"` และการยืนยันตัวตน OpenAI ปกติ | `/status` แสดงรันไทม์ OpenClaw        | ใช้เฉพาะเมื่อตั้งใจใช้ OpenClaw |
| คอนฟิกดั้งเดิม                                        | การอ้างอิง Codex GPT ดั้งเดิม                                                  | `openclaw doctor --fix` เขียนใหม่ให้     | อย่าเขียนคอนฟิกใหม่ด้วยวิธีนี้      |
| อะแดปเตอร์ ACP/acpx Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                               | สถานะงาน/เซสชัน ACP                 | แยกจาก harness Codex แบบเนทีฟ    |

`agents.defaults.imageModel` ใช้การแยก prefix แบบเดียวกัน ใช้ `openai/gpt-*`
สำหรับเส้นทาง OpenAI ปกติ และใช้ `codex/gpt-*` เฉพาะเมื่อการทำความเข้าใจภาพ
ควรรันผ่านเทิร์นของแอปเซิร์ฟเวอร์ Codex ที่มีขอบเขต อย่าใช้
การอ้างอิง Codex GPT ดั้งเดิม; doctor จะเขียน prefix ดั้งเดิมนั้นใหม่เป็น `openai/gpt-*`

## รูปแบบการปรับใช้

### การปรับใช้ Codex ขั้นพื้นฐาน

ใช้คอนฟิก quickstart เมื่อทุกเทิร์นของเอเจนต์ OpenAI ควรใช้ Codex เป็นค่าเริ่มต้น

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

### การปรับใช้หลาย provider ร่วมกัน

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

ด้วยคอนฟิกนี้ เอเจนต์ `main` ใช้เส้นทาง provider ปกติของตน และเอเจนต์
`codex` ใช้แอปเซิร์ฟเวอร์ Codex

### การปรับใช้ Codex แบบ fail-closed

สำหรับเทิร์นของเอเจนต์ OpenAI นั้น `openai/gpt-*` จะ resolve เป็น Codex อยู่แล้วเมื่อ
plugin ที่บันเดิลมาพร้อมใช้งาน เพิ่มนโยบายรันไทม์แบบชัดเจนเมื่อคุณต้องการกฎ
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

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก plugin Codex ถูกปิดใช้งาน
แอปเซิร์ฟเวอร์เก่าเกินไป หรือแอปเซิร์ฟเวอร์เริ่มทำงานไม่ได้

## นโยบายแอปเซิร์ฟเวอร์

โดยค่าเริ่มต้น plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการไว้ในเครื่องด้วย stdio
transport ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจจะรันไฟล์ปฏิบัติการ
อื่น ใช้ WebSocket transport เฉพาะเมื่อมีแอปเซิร์ฟเวอร์รันอยู่ที่อื่นแล้ว:

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

เซสชันแอปเซิร์ฟเวอร์ stdio ในเครื่องใช้ posture ของผู้ปฏิบัติการในเครื่องที่เชื่อถือได้เป็นค่าเริ่มต้น:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` หากข้อกำหนด Codex ในเครื่องไม่อนุญาต
posture YOLO โดยนัยนี้ OpenClaw จะเลือกสิทธิ์ guardian ที่อนุญาตแทน
เมื่อ sandbox ของ OpenClaw ทำงานอยู่สำหรับเซสชัน OpenClaw จะปิดใช้งาน
Code Mode เนทีฟของ Codex, เซิร์ฟเวอร์ MCP ของผู้ใช้ และการทำงานของ plugin ที่หนุนด้วยแอปสำหรับ
เทิร์นนั้น แทนที่จะพึ่งพา sandboxing ฝั่งโฮสต์ของ Codex การเข้าถึง shell จะถูกเปิดเผย
ผ่านเครื่องมือแบบไดนามิกที่หนุนด้วย sandbox ของ OpenClaw เช่น `sandbox_exec` และ
`sandbox_process` เมื่อเครื่องมือ exec/process ปกติพร้อมใช้งาน

ใช้โหมด exec ของ OpenClaw ที่ normalized เมื่อคุณต้องการ auto-review เนทีฟของ Codex ก่อน
การออกจาก sandbox หรือสิทธิ์เพิ่มเติม:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

สำหรับเซสชันแอปเซิร์ฟเวอร์ Codex นั้น OpenClaw จะแมป `tools.exec.mode: "auto"` ไปเป็นการอนุมัติที่ Guardian ตรวจทานของ Codex
โดยทั่วไปคือ
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` และ
`sandbox: "workspace-write"` เมื่อข้อกำหนดในเครื่องอนุญาตค่าเหล่านั้น
ใน `tools.exec.mode: "auto"` OpenClaw จะไม่คงค่า override ดั้งเดิมของ Codex ที่ไม่ปลอดภัย
`approvalPolicy: "never"` หรือ `sandbox: "danger-full-access"`; ใช้
`tools.exec.mode: "full"` สำหรับ posture Codex แบบไม่ต้องขออนุมัติที่ตั้งใจไว้
preset ดั้งเดิม `plugins.entries.codex.config.appServer.mode: "guardian"` ยังคง
ทำงานได้ แต่ `tools.exec.mode: "auto"` คือพื้นผิว OpenClaw ที่ normalized แล้ว

สำหรับการเปรียบเทียบระดับโหมดกับการอนุมัติ host exec และสิทธิ์ ACPX
ดู [โหมดสิทธิ์](/th/tools/permission-modes)

สำหรับทุกฟิลด์ของแอปเซิร์ฟเวอร์ ลำดับการยืนยันตัวตน การแยกสภาพแวดล้อม การค้นพบ และ
พฤติกรรม timeout ดู [ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## คำสั่งและการวินิจฉัย

plugin ที่บันเดิลมาจะลงทะเบียน `/codex` เป็นคำสั่ง slash บนทุก channel ที่
รองรับคำสั่งข้อความของ OpenClaw

การดำเนินการและการควบคุมแบบเนทีฟต้องใช้ owner หรือไคลเอนต์ Gateway แบบ `operator.admin`
ซึ่งรวมถึงการผูกหรือกลับมาใช้ thread ต่อ การส่งหรือหยุดเทิร์น
การเปลี่ยนโมเดล fast-mode หรือสถานะสิทธิ์ การ compact หรือ review และ
การถอด binding ผู้ส่งที่ได้รับอนุญาตรายอื่นยังคงมีคำสั่งแบบอ่านอย่างเดียวสำหรับสถานะ ความช่วยเหลือ
บัญชี โมเดล thread เซิร์ฟเวอร์ MCP skill และการตรวจสอบ binding

รูปแบบทั่วไป:

- `/codex status` ตรวจสอบการเชื่อมต่อแอปเซิร์ฟเวอร์ โมเดล บัญชี rate limit
  เซิร์ฟเวอร์ MCP และ skills
- `/codex models` แสดงรายการโมเดลแอปเซิร์ฟเวอร์ Codex ที่ใช้งานอยู่
- `/codex threads [filter]` แสดงรายการ thread แอปเซิร์ฟเวอร์ Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับ
  thread Codex ที่มีอยู่
- `/codex compact` ขอให้แอปเซิร์ฟเวอร์ Codex compact thread ที่แนบอยู่
- `/codex review` เริ่ม review เนทีฟของ Codex สำหรับ thread ที่แนบอยู่
- `/codex diagnostics [note]` ถามก่อนส่ง feedback ของ Codex สำหรับ
  thread ที่แนบอยู่
- `/codex account` แสดงบัญชีและสถานะ rate-limit
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของแอปเซิร์ฟเวอร์ Codex
- `/codex skills` แสดงรายการ skills ของแอปเซิร์ฟเวอร์ Codex

สำหรับรายงานขอความช่วยเหลือส่วนใหญ่ ให้เริ่มด้วย `/diagnostics [note]` ในบทสนทนา
ที่เกิดบั๊กขึ้น คำสั่งนี้สร้างรายงานการวินิจฉัย Gateway หนึ่งรายการ และสำหรับเซสชัน
Codex harness จะขออนุมัติเพื่อส่งชุด feedback ของ Codex ที่เกี่ยวข้อง
ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรม
แชทกลุ่ม

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลด feedback ของ Codex
สำหรับ thread ที่แนบอยู่ในปัจจุบันโดยเฉพาะ โดยไม่มีชุดการวินิจฉัย Gateway แบบเต็ม

### ตรวจสอบ thread Codex ในเครื่อง

วิธีที่เร็วที่สุดในการตรวจสอบการรัน Codex ที่มีปัญหามักเป็นการเปิด thread Codex
เนทีฟโดยตรง:

```bash
codex resume <thread-id>
```

รับ thread id จากคำตอบ `/diagnostics` ที่เสร็จแล้ว, `/codex binding` หรือ
`/codex threads [filter]`

สำหรับกลไกการอัปโหลดและขอบเขตการวินิจฉัยระดับรันไทม์ ดู
[รันไทม์ Codex harness](/th/plugins/codex-harness-runtime#codex-feedback-upload)

การยืนยันตัวตนถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenAI ที่จัดลำดับไว้สำหรับเอเจนต์ โดยควรอยู่ใต้
   `auth.order.openai` รัน `openclaw doctor --fix` เพื่อ migrate
   id โปรไฟล์การยืนยันตัวตน Codex ดั้งเดิมและลำดับการยืนยันตัวตน Codex ดั้งเดิม
2. บัญชีที่มีอยู่ของแอปเซิร์ฟเวอร์ใน Codex home ของเอเจนต์นั้น
3. เฉพาะการเปิดแอปเซิร์ฟเวอร์ stdio ในเครื่องเท่านั้น ใช้ `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อไม่มีบัญชีแอปเซิร์ฟเวอร์อยู่ และยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw พบโปรไฟล์การยืนยันตัวตน Codex แบบการสมัครใช้งาน ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ spawn ขึ้นมา สิ่งนี้
ทำให้ API key ระดับ Gateway ยังพร้อมใช้งานสำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้เทิร์นแอปเซิร์ฟเวอร์ Codex แบบเนทีฟถูกคิดเงินผ่าน API โดยไม่ตั้งใจ
โปรไฟล์ API-key Codex แบบชัดเจนและ fallback env-key ของ stdio ในเครื่องใช้การเข้าสู่ระบบแอปเซิร์ฟเวอร์
แทน env ของกระบวนการลูกที่สืบทอดมา การเชื่อมต่อแอปเซิร์ฟเวอร์ WebSocket
จะไม่ได้รับ fallback API-key env ของ Gateway; ใช้โปรไฟล์การยืนยันตัวตนแบบชัดเจนหรือ
บัญชีของแอปเซิร์ฟเวอร์ระยะไกลเอง
เมื่อกำหนดค่า plugin Codex แบบเนทีฟแล้ว OpenClaw จะติดตั้งหรือรีเฟรช plugin เหล่านั้น
ผ่านแอปเซิร์ฟเวอร์ที่เชื่อมต่อ ก่อนเปิดเผยแอปที่ plugin เป็นเจ้าของให้กับ
thread Codex `app/list` ยังคงเป็นแหล่งความจริงสำหรับ app ids,
การเข้าถึงได้ และ metadata แต่ OpenClaw เป็นเจ้าของการตัดสินใจเปิดใช้ต่อ thread:
หากนโยบายอนุญาตแอปที่เข้าถึงได้ซึ่งอยู่ในรายการ OpenClaw จะส่ง
`thread/start.config.apps[appId].enabled = true` แม้เมื่อ `app/list` ปัจจุบัน
รายงานว่าแอปนั้นปิดใช้งานอยู่ เส้นทางนี้ไม่สร้างการติดตั้งแอปสำหรับ
id ที่ไม่รู้จักขึ้นมาเอง; OpenClaw จะเปิดใช้งานเฉพาะ marketplace plugins ด้วย `plugin/install`
แล้วจึงรีเฟรช inventory

หากโปรไฟล์การสมัครใช้งานเจอ usage limit ของ Codex OpenClaw จะบันทึกเวลา reset
เมื่อ Codex รายงานไว้ และลองใช้โปรไฟล์การยืนยันตัวตนถัดไปที่จัดลำดับไว้สำหรับการรัน Codex เดียวกัน
เมื่อพ้นเวลา reset แล้ว โปรไฟล์การสมัครใช้งานจะกลับมา eligible อีกครั้ง
โดยไม่เปลี่ยนโมเดล `openai/gpt-*` หรือรันไทม์ Codex ที่เลือกไว้

สำหรับการเปิดแอปเซิร์ฟเวอร์ stdio ในเครื่อง OpenClaw ตั้งค่า `CODEX_HOME` เป็นไดเรกทอรี
ต่อเอเจนต์ เพื่อให้คอนฟิก Codex, ไฟล์ auth/account, แคช/ข้อมูล plugin และสถานะ
thread เนทีฟ ไม่อ่านหรือเขียน `~/.codex` ส่วนตัวของผู้ปฏิบัติการตามค่าเริ่มต้น
OpenClaw จะคง `HOME` ของกระบวนการปกติไว้; subprocesses ที่ Codex รัน
ยังคงหา config และ tokens ใน user-home ได้ และ Codex อาจค้นพบรายการ
`$HOME/.agents/skills` และ `$HOME/.agents/plugins/marketplace.json` ที่ใช้ร่วมกันได้

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

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูกแอปเซิร์ฟเวอร์ Codex ที่ spawn ขึ้นมาเท่านั้น
OpenClaw จะลบ `CODEX_HOME` และ `HOME` ออกจากรายการนี้ระหว่างการ normalize การเปิดในเครื่อง:
`CODEX_HOME` ยังคงเป็นแบบต่อเอเจนต์ และ `HOME` ยังคงสืบทอดมาเพื่อให้
subprocesses ใช้สถานะ user-home ปกติได้

เครื่องมือแบบไดนามิกของ Codex ใช้ค่าเริ่มต้นเป็นการโหลดแบบ `searchable` OpenClaw ไม่เปิดเผย
เครื่องมือแบบไดนามิกที่ซ้ำกับการทำงานในเวิร์กสเปซแบบเนทีฟของ Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` และ `update_plan` เครื่องมือผสานรวมของ
OpenClaw ส่วนใหญ่ที่เหลือ เช่น การรับส่งข้อความ, สื่อ, cron, เบราว์เซอร์, โหนด,
gateway และ `heartbeat_respond` พร้อมใช้งานผ่านการค้นหาเครื่องมือของ Codex ภายใต้
เนมสเปซ `openclaw` ซึ่งช่วยให้บริบทเริ่มต้นของโมเดลเล็กลง การค้นหาเว็บ
ใช้เครื่องมือ `web_search` ที่ Codex โฮสต์ไว้เป็นค่าเริ่มต้นเมื่อเปิดใช้งานการค้นหาและไม่ได้เลือก
ผู้ให้บริการที่มีการจัดการ การค้นหาที่โฮสต์แบบเนทีฟและเครื่องมือแบบไดนามิก `web_search`
ที่ OpenClaw จัดการจะแยกใช้ร่วมกันไม่ได้ เพื่อให้การค้นหาที่มีการจัดการไม่สามารถข้าม
ข้อจำกัดโดเมนแบบเนทีฟได้ OpenClaw ใช้เครื่องมือที่มีการจัดการเมื่อการค้นหาที่โฮสต์ไว้
ไม่พร้อมใช้งาน ถูกปิดใช้งานอย่างชัดเจน หรือถูกแทนที่ด้วยผู้ให้บริการที่มีการจัดการที่เลือกไว้
OpenClaw ปิดใช้งานส่วนขยาย `web.run` แบบสแตนด์อโลนของ Codex ไว้ต่อไป เพราะ
ทราฟฟิก app-server ในโปรดักชันปฏิเสธเนมสเปซ `web` ที่ผู้ใช้กำหนดเอง
`tools.web.search.enabled: false` ปิดใช้งานทั้งสองเส้นทาง เช่นเดียวกับการรันแบบ LLM-only
ที่ปิดใช้งานเครื่องมือ Codex ถือว่า `"cached"` เป็นค่ากำหนด และแปลงค่านี้เป็นการเข้าถึง
ภายนอกแบบสดสำหรับเทิร์น app-server ที่ไม่ถูกจำกัด ฟอลแบ็กอัตโนมัติที่มีการจัดการ
จะปิดแบบล้มเหลวเมื่อมีการตั้งค่า `allowedDomains` แบบเนทีฟ เพื่อไม่ให้ข้ามรายการอนุญาตได้
การเปลี่ยนแปลงนโยบายการค้นหาที่มีผลจริงแบบถาวรจะหมุนเธรด Codex ที่ผูกไว้ก่อนเทิร์นถัดไป
ข้อจำกัดชั่วคราวรายเทิร์นใช้เธรดจำกัดชั่วคราวและคงการผูกเดิมไว้สำหรับการกลับมาทำต่อภายหลัง
`sessions_yield` และการตอบกลับแหล่งที่มาแบบใช้เฉพาะเครื่องมือข้อความยังคงเป็นแบบตรง
เพราะสิ่งเหล่านั้นเป็นสัญญาการควบคุมเทิร์น `sessions_spawn` ยังค้นหาได้ต่อไป เพื่อให้
`spawn_agent` แบบเนทีฟของ Codex ยังคงเป็นพื้นผิว subagent หลักของ Codex ขณะที่การมอบหมายงาน
ผ่าน OpenClaw หรือ ACP อย่างชัดเจนยังคงพร้อมใช้งานผ่านเนมสเปซเครื่องมือแบบไดนามิก
`openclaw` คำแนะนำการทำงานร่วมกันของ Heartbeat บอกให้ Codex ค้นหา
`heartbeat_respond` ก่อนจบเทิร์น Heartbeat เมื่อเครื่องมือยังไม่ได้โหลด

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับ app-server ของ Codex
แบบกำหนดเองที่ไม่สามารถค้นหาเครื่องมือแบบไดนามิกที่เลื่อนไว้ หรือเมื่อดีบักเพย์โหลดเครื่องมือทั้งหมด

ฟิลด์ Plugin ของ Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น        | ความหมาย                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | ใช้ `"direct"` เพื่อวางเครื่องมือแบบไดนามิกของ OpenClaw ลงในบริบทเครื่องมือ Codex เริ่มต้นโดยตรง |
| `codexDynamicToolsExclude` | `[]`           | ชื่อเครื่องมือแบบไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากเทิร์น app-server ของ Codex              |
| `codexPlugins`             | ปิดใช้งาน       | การรองรับ Plugin/แอป Codex แบบเนทีฟสำหรับ Plugin คัดสรรที่ติดตั้งจากซอร์สและถูกย้ายแล้ว           |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` จะ spawn Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | ไบนารี Codex ที่จัดการให้                                   | ไฟล์ปฏิบัติการสำหรับ stdio transport ปล่อยไว้ไม่ตั้งค่าเพื่อใช้ไบนารีที่จัดการให้ ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับ stdio transport                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | ไม่ได้ตั้งค่า                                                  | URL ของ WebSocket app-server                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | ไม่ได้ตั้งค่า                                                  | Bearer token สำหรับ WebSocket transport รับได้ทั้งสตริงตรงตัวหรือ SecretInput เช่น `${CODEX_APP_SERVER_TOKEN}`                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | header เพิ่มเติมของ WebSocket ค่า header รับได้ทั้งสตริงตรงตัวหรือค่า SecretInput เช่น `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะถูกลบออกจากโปรเซส stdio app-server ที่ spawn หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว OpenClaw จะเก็บ `CODEX_HOME` แยกต่อ agent และ `HOME` ที่สืบทอดมาสำหรับการเปิดใช้งานในเครื่อง                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | เลือกใช้พื้นผิวเครื่องมือ code-mode-only ของ Codex เครื่องมือแบบไดนามิกของ OpenClaw ยังคงลงทะเบียนกับ Codex เพื่อให้การเรียก `tools.*` แบบซ้อนกันส่งกลับผ่าน bridge `item/tool/call` ของ app-server                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | ไม่ได้ตั้งค่า                                                  | root ของ workspace สำหรับ Codex app-server ระยะไกล เมื่อตั้งค่าแล้ว OpenClaw จะอนุมาน root ของ workspace ในเครื่องจาก workspace ของ OpenClaw ที่ resolve แล้ว รักษา suffix ของ cwd ปัจจุบันไว้ใต้ root ระยะไกลนี้ และส่งเฉพาะ cwd สุดท้ายของ app-server ไปยัง Codex หาก cwd อยู่นอก root ของ workspace OpenClaw ที่ resolve แล้ว OpenClaw จะหยุดแบบปิดกั้นแทนที่จะส่งพาธภายใน Gateway ไปยัง app-server ระยะไกล |
| `requestTimeoutMs`                            | `60000`                                                | timeout สำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | หน้าต่างเงียบหลังจาก Codex รับ turn หรือหลังจากคำขอ app-server ที่มีขอบเขตตาม turn ขณะที่ OpenClaw รอ `turn/completed`                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ตัวเฝ้าระวัง completion-idle และความคืบหน้าที่ใช้หลังจากส่งต่องานให้เครื่องมือ, เครื่องมือ native ทำงานเสร็จ, ความคืบหน้าของ assistant แบบดิบหลังใช้เครื่องมือ, การ reasoning แบบดิบเสร็จสิ้น, หรือความคืบหน้าของ reasoning ขณะที่ OpenClaw รอ `turn/completed` ใช้ค่านี้สำหรับ workload ที่เชื่อถือได้หรือหนัก ซึ่งการสังเคราะห์หลังใช้เครื่องมือสามารถเงียบได้นานกว่างบเวลาปล่อย assistant สุดท้ายอย่างสมเหตุสมผล                                |
| `mode`                                        | `"yolo"` เว้นแต่ข้อกำหนดของ Codex ในเครื่องจะไม่อนุญาต YOLO | preset สำหรับการประมวลผลแบบ YOLO หรือแบบ guardian-reviewed ข้อกำหนด stdio ในเครื่องที่ละเว้น `danger-full-access`, approval แบบ `never`, หรือ reviewer แบบ `user` จะทำให้ค่าเริ่มต้นโดยนัยเป็น guardian                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` หรือนโยบาย approval ของ guardian ที่อนุญาต       | นโยบาย approval native ของ Codex ที่ส่งไปยังการเริ่ม thread/resume/turn ค่าเริ่มต้นของ guardian จะเลือก `"on-request"` เมื่ออนุญาต                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` หรือ sandbox ของ guardian ที่อนุญาต  | โหมด sandbox native ของ Codex ที่ส่งไปยังการเริ่ม thread/resume ค่าเริ่มต้นของ guardian จะเลือก `"workspace-write"` เมื่ออนุญาต ไม่เช่นนั้นใช้ `"read-only"` เมื่อ sandbox ของ OpenClaw เปิดใช้งาน turn แบบ `danger-full-access` จะใช้ Codex `workspace-write` พร้อมสิทธิ์เข้าถึงเครือข่ายที่ได้จากการตั้งค่า egress ของ sandbox OpenClaw                                                                                     |
| `approvalsReviewer`                           | `"user"` หรือ reviewer ของ guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex review prompt approval native เมื่ออนุญาต ไม่เช่นนั้นใช้ `guardian_subagent` หรือ `user` `guardian_subagent` ยังคงเป็น alias แบบ legacy                                                                                                                                                                                                                              |
| `serviceTier`                                 | ไม่ได้ตั้งค่า                                                  | service tier ของ Codex app-server แบบไม่บังคับ `"priority"` เปิดใช้การกำหนดเส้นทาง fast-mode, `"flex"` ขอการประมวลผลแบบ flex, `null` ล้าง override และ legacy `"fast"` จะถูกรับเป็น `"priority"`                                                                                                                                                                                                 |
| `networkProxy`                                | ปิดใช้งาน                                               | เลือกใช้ระบบเครือข่าย permissions-profile ของ Codex สำหรับคำสั่ง app-server OpenClaw จะกำหนดค่า config `permissions.<profile>.network` ที่เลือก และเลือกด้วย `default_permissions` แทนการส่ง `sandbox`                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | การเลือกใช้ preview ที่ลงทะเบียนสภาพแวดล้อม Codex ที่มี sandbox ของ OpenClaw รองรับกับ Codex app-server 0.132.0 หรือใหม่กว่า เพื่อให้การประมวลผล native ของ Codex ทำงานภายใน sandbox ของ OpenClaw ที่ใช้งานอยู่ได้                                                                                                                                                                                                         |

`appServer.networkProxy` เป็นแบบชัดเจนเพราะมันเปลี่ยนสัญญา sandbox ของ Codex
เมื่อเปิดใช้งาน OpenClaw จะตั้งค่า `features.network_proxy.enabled` และ
`default_permissions` ใน config ของ thread Codex ด้วย เพื่อให้ permission
profile ที่สร้างขึ้นสามารถเริ่มระบบเครือข่ายที่ Codex จัดการได้ โดยค่าเริ่มต้น OpenClaw จะสร้างชื่อ
profile `openclaw-network-<fingerprint>` ที่ทนต่อการชนกันจากเนื้อหา
profile ใช้ `profileName` เฉพาะเมื่อต้องการชื่อในเครื่องที่เสถียรเท่านั้น

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

หาก runtime ปกติของ app-server จะเป็น `danger-full-access` การเปิดใช้
`networkProxy` จะใช้การเข้าถึงระบบไฟล์แบบ workspace-style สำหรับ permission
profile ที่สร้างขึ้น การบังคับใช้งานเครือข่ายที่ Codex จัดการคือระบบเครือข่ายแบบ sandboxed
ดังนั้น profile แบบ full-access จะไม่ป้องกันทราฟฟิกขาออก
รายการโดเมนใช้ `allow` หรือ `deny`; รายการ Unix socket ใช้ค่า
`allow` หรือ `none` ของ Codex

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` ใช้ watchdog ของ
OpenClaw ค่าเริ่มต้น 90 วินาที อาร์กิวเมนต์ `timeoutMs` รายการต่อการเรียกที่เป็นค่าบวกจะขยาย
หรือลดงบเวลาของเครื่องมือนั้นโดยเฉพาะ เครื่องมือ `image_generate` ใช้
`agents.defaults.imageGenerationModel.timeoutMs` เมื่อการเรียกเครื่องมือไม่ได้
กำหนด timeout ของตัวเอง มิฉะนั้นจะใช้ค่าเริ่มต้นสำหรับการสร้างภาพ 120 วินาที
เครื่องมือ `image` สำหรับการเข้าใจสื่อใช้
`tools.media.image.timeoutSeconds` หรือค่าเริ่มต้นสื่อ 60 วินาที สำหรับการ
เข้าใจภาพ timeout นั้นใช้กับตัวคำขอเองและจะไม่ถูกลดลง
จากงานเตรียมการก่อนหน้า งบเวลาของเครื่องมือแบบไดนามิกถูก
จำกัดสูงสุดที่ 600000 ms เมื่อ timeout OpenClaw จะยกเลิก signal ของเครื่องมือ
เมื่อรองรับ และส่งคืนการตอบกลับเครื่องมือแบบไดนามิกที่ล้มเหลวให้ Codex เพื่อให้เทิร์น
ดำเนินต่อได้แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`
watchdog นี้คืองบเวลาภายนอกของ dynamic `item/tool/call`; timeout ของคำขอที่เฉพาะเจาะจงตาม provider
จะทำงานอยู่ภายใน call นั้นและคง semantics ของ timeout ของตัวเองไว้

หลังจาก Codex รับเทิร์น และหลังจาก OpenClaw ตอบกลับคำขอ app-server
ที่มีขอบเขตตามเทิร์น harness คาดว่า Codex จะมีความคืบหน้าในเทิร์นปัจจุบันและ
สุดท้ายจบเทิร์นแบบ native ด้วย `turn/completed` หาก app-server
เงียบไปเป็นเวลา `appServer.turnCompletionIdleTimeoutMs` OpenClaw จะพยายาม
interrupt เทิร์น Codex แบบ best-effort บันทึก diagnostic timeout และปล่อย
lane ของเซสชัน OpenClaw เพื่อไม่ให้ข้อความแชทถัดไปถูกคิวไว้หลังเทิร์น
native ที่ค้าง stale notification ส่วนใหญ่ที่ไม่ใช่ terminal สำหรับเทิร์นเดียวกันจะปลด
watchdog สั้นนั้น เพราะ Codex ได้พิสูจน์แล้วว่าเทิร์นยังมีชีวิตอยู่ การส่งต่อเครื่องมือใช้
งบเวลา idle หลังเครื่องมือที่ยาวกว่า: หลังจาก OpenClaw ส่งคืน response `item/tool/call`,
หลังจาก item เครื่องมือ native เช่น `commandExecution` เสร็จสิ้น, หลังจาก completion ของ
`custom_tool_call_output` แบบ raw และหลังจาก assistant progress แบบ raw หลังเครื่องมือ,
reasoning completion แบบ raw หรือ reasoning progress guard ใช้
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` เมื่อกำหนดค่าไว้ และ
ตั้งค่าเริ่มต้นเป็นห้านาทีหากไม่กำหนด งบเวลาหลังเครื่องมือเดียวกันนั้นยังขยาย
progress watchdog สำหรับช่วง synthesis ที่เงียบก่อน Codex จะ emit event
ของเทิร์นปัจจุบันถัดไป notification app-server ระดับ global เช่น rate-limit update
จะไม่ reset ความคืบหน้าของ turn-idle reasoning completion, completion ของ
`agentMessage` ใน commentary และ raw reasoning หรือ assistant progress ก่อนเครื่องมือสามารถ
ตามด้วย final reply อัตโนมัติได้ จึงใช้ guard สำหรับ reply หลัง progress
แทนการปล่อย lane ของเซสชันทันที เฉพาะ item `agentMessage` ที่ completed แบบ final/non-commentary
และ raw assistant completion ก่อนเครื่องมือเท่านั้นที่ arm การปล่อย assistant-output:
หาก Codex เงียบต่อไปโดยไม่มี `turn/completed` OpenClaw จะ interrupt
เทิร์น native แบบ best-effort และปล่อย lane ของเซสชัน หาก turn watch อื่นชนะ
race การปล่อยนั้น OpenClaw ยังยอมรับ item assistant แบบ final ที่ completed แล้วเมื่อไม่มี
คำขอ native, item, หรือ completion ของเครื่องมือแบบไดนามิกที่ยัง active เหลืออยู่ และ
การปล่อย assistant-output ยังเป็นของ item ที่ completed ล่าสุด โดยไม่มี
item completion ที่ใหม่กว่า สิ่งนี้สามารถรักษาคำตอบสุดท้ายไว้หลังงานเครื่องมือที่ completed
โดยไม่ replay เทิร์น delta ของ assistant บางส่วน, reply ก่อนหน้าที่ stale
และ completion ภายหลังที่ว่างเปล่าไม่เข้าเกณฑ์ ความล้มเหลวของ app-server stdio
ที่ replay-safe ได้
รวมถึง timeout ของ turn-completion idle ที่ไม่มีหลักฐาน assistant, tool, active-item
หรือ side-effect จะถูก retry หนึ่งครั้งใน app-server attempt ใหม่ timeout ที่ไม่ปลอดภัย
จะยัง retire client app-server ที่ค้างและปล่อย lane ของเซสชัน OpenClaw
นอกจากนี้ยังล้าง binding ของ native thread ที่ stale แทนที่จะ replay
โดยอัตโนมัติ timeout ของ completion-watch จะแสดงข้อความ timeout เฉพาะ Codex:
กรณี replay-safe จะบอกว่า response อาจไม่สมบูรณ์ ส่วนกรณี unsafe
จะบอกให้ผู้ใช้ตรวจสอบสถานะปัจจุบันก่อน retry diagnostic timeout แบบ public
มี field เชิงโครงสร้าง เช่น method ของ notification app-server ล่าสุด,
id/type/role ของ raw assistant response item, จำนวน active request/item และสถานะ watch ที่ armed
เมื่อ notification ล่าสุดเป็น raw assistant response item diagnostic เหล่านั้น
ยังมี preview ข้อความ assistant แบบจำกัดขนาดด้วย โดยจะไม่มี raw prompt หรือ
เนื้อหาเครื่องมือ

environment override ยังคงพร้อมใช้งานสำหรับการทดสอบ local:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้าม binary ที่จัดการให้เมื่อ
ไม่ได้ตั้งค่า `appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบ local แบบครั้งเดียว แนะนำให้ใช้ config
สำหรับการ deploy ที่ทำซ้ำได้ เพราะจะเก็บพฤติกรรมของ Plugin ไว้ใน
ไฟล์ที่ review เดียวกันกับการตั้งค่า harness ของ Codex ส่วนที่เหลือ

## Plugin native ของ Codex

การรองรับ Plugin native ของ Codex ใช้ความสามารถ app และ Plugin
ของ app-server ของ Codex เองใน thread Codex เดียวกับเทิร์น harness ของ OpenClaw OpenClaw
ไม่แปล Plugin ของ Codex เป็นเครื่องมือแบบไดนามิก `codex_plugin_*` ของ OpenClaw
แบบสังเคราะห์

`codexPlugins` มีผลเฉพาะกับเซสชันที่เลือก harness native ของ Codex เท่านั้น
ไม่มีผลกับการรัน harness ในตัว, การรัน provider OpenAI ปกติ, binding การสนทนา ACP
หรือ harness อื่น

config ขั้นต่ำที่ migrate แล้ว:

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

config ของ thread app จะถูกคำนวณเมื่อ OpenClaw สร้างเซสชัน harness ของ Codex
หรือแทนที่ binding ของ thread Codex ที่ stale จะไม่คำนวณใหม่ในทุกเทิร์น
หลังจากเปลี่ยน `codexPlugins` ให้ใช้ `/new`, `/reset` หรือ restart gateway เพื่อให้
เซสชัน harness ของ Codex ในอนาคตเริ่มต้นด้วยชุด app ที่อัปเดตแล้ว

สำหรับสิทธิ์ eligibility ในการ migration, inventory ของ app, นโยบาย destructive action,
elicitations และ diagnostic ของ Plugin native โปรดดู
[Plugin native ของ Codex](/th/plugins/codex-native-plugins)

การเข้าถึง app และ Plugin ฝั่ง OpenAI ถูกควบคุมโดยบัญชี Codex ที่ลงชื่อเข้าใช้
และสำหรับ workspace Business และ Enterprise/Edu จะถูกควบคุมโดย app control ของ workspace โปรดดู
[การใช้ Codex กับแผน ChatGPT ของคุณ](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
สำหรับภาพรวมบัญชีและ workspace-control ของ OpenAI

## Computer Use

Computer Use ครอบคลุมอยู่ในคู่มือการตั้งค่าของตัวเอง:
[Codex Computer Use](/th/plugins/codex-computer-use)

ฉบับย่อ: OpenClaw ไม่ได้ vendor app ควบคุม desktop หรือ execute
desktop action เอง แต่จะเตรียม app-server ของ Codex, ตรวจสอบว่า
MCP server `computer-use` พร้อมใช้งาน แล้วให้ Codex เป็นเจ้าของการเรียกเครื่องมือ MCP
native ระหว่างเทิร์นโหมด Codex

## ขอบเขต runtime

harness ของ Codex เปลี่ยนเฉพาะตัว executor agent แบบฝังระดับต่ำเท่านั้น

- รองรับเครื่องมือแบบไดนามิกของ OpenClaw Codex ขอให้ OpenClaw execute
  เครื่องมือเหล่านั้น ดังนั้น OpenClaw ยังคงอยู่ในเส้นทาง execution
- เครื่องมือ shell, patch, MCP และ native app แบบ native ของ Codex เป็นของ Codex
  OpenClaw สามารถสังเกตหรือ block native event บางรายการผ่าน relay ที่รองรับ
  แต่จะไม่ rewrite อาร์กิวเมนต์เครื่องมือ native
- Codex เป็นเจ้าของ Compaction แบบ native OpenClaw เก็บ transcript mirror สำหรับประวัติ channel,
  การค้นหา, `/new`, `/reset` และการสลับ model หรือ harness ในอนาคต แต่
  จะไม่แทนที่ Compaction ของ Codex ด้วย summarizer ของ OpenClaw หรือ context-engine
- การสร้างสื่อ, การเข้าใจสื่อ, TTS, approval และ output ของ messaging-tool
  ยังคงผ่านการตั้งค่า provider/model ของ OpenClaw ที่ตรงกัน
- `tool_result_persist` ใช้กับผลลัพธ์เครื่องมือใน transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่
  record ผลลัพธ์เครื่องมือ native ของ Codex

สำหรับ hook layer, surface V1 ที่รองรับ, การจัดการ permission แบบ native, การบังคับทิศทาง queue,
กลไกอัปโหลด feedback ของ Codex และรายละเอียด Compaction โปรดดู
[runtime ของ harness Codex](/th/plugins/codex-harness-runtime)

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็น provider `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ
config ใหม่ เลือก model `openai/gpt-*`, เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้ exclude
`codex`

**OpenClaw ใช้ harness ในตัวแทน Codex:** ตรวจสอบให้แน่ใจว่า model ref เป็น
`openai/gpt-*` บน provider OpenAI อย่างเป็นทางการ และ Plugin Codex
ติดตั้งและเปิดใช้งานแล้ว หากต้องการหลักฐานที่เข้มงวดระหว่างทดสอบ ให้ตั้ง provider หรือ
model `agentRuntime.id: "codex"` runtime Codex ที่บังคับไว้จะ fail แทนที่จะ
fallback ไป OpenClaw

**runtime OpenAI Codex fallback ไปเส้นทาง API-key:** รวบรวม excerpt gateway
ที่ redacted แล้วซึ่งแสดง model, runtime, provider ที่เลือก และ failure
ขอให้ผู้ร่วมงานที่ได้รับผลกระทบรันคำสั่ง read-only นี้บน host OpenClaw ของตน:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

excerpt ที่มีประโยชน์มักมี `openai/gpt-5.5` หรือ `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` หรือ `harnessRuntime`,
`candidateProvider: "openai"` และผลลัพธ์ `401`, `Incorrect API key` หรือ
`No API key` การรันที่แก้ไขแล้วควรแสดงเส้นทาง OpenAI OAuth
แทน failure ของ OpenAI API-key แบบ plain

**config model ref ของ Codex legacy ยังเหลืออยู่:** รัน `openclaw doctor --fix`
Doctor จะ rewrite model ref legacy เป็น `openai/*`, ลบ pin ของ runtime ใน session ที่ stale และ
whole-agent และรักษา override ของ auth-profile ที่มีอยู่ไว้

**app-server ถูก reject:** ใช้ app-server ของ Codex `0.125.0` หรือใหม่กว่า
prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix build เช่น
`0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูก reject เพราะ OpenClaw ทดสอบ
protocol floor แบบ stable `0.125.0`

**`/codex status` เชื่อมต่อไม่ได้:** ตรวจสอบว่า Plugin `codex` ที่ bundled อยู่
เปิดใช้งานแล้ว, `plugins.allow` รวมรายการนี้เมื่อมีการกำหนด allowlist และ
`appServer.command`, `url`, `authToken` หรือ header แบบ custom ใด ๆ ถูกต้อง

**การค้นพบ model ช้า:** ลด
`plugins.entries.codex.config.discovery.timeoutMs` หรือปิด discovery โปรดดู
[ข้อมูลอ้างอิง harness Codex](/th/plugins/codex-harness-reference#model-discovery)

**transport WebSocket fail ทันที:** ตรวจสอบ `appServer.url`, `authToken`,
header และตรวจสอบว่า app-server ระยะไกลพูด protocol version เดียวกันของ app-server Codex

**เครื่องมือ shell แบบเนทีฟหรือ patch ถูกบล็อกด้วย `Native hook relay unavailable`:**
เธรด Codex ยังคงพยายามใช้ id ของ native hook relay ที่ OpenClaw ไม่ได้
ลงทะเบียนไว้อีกต่อไป นี่เป็นปัญหาของ transport สำหรับ native Codex hook
ไม่ใช่ความล้มเหลวของ backend ACP, provider, GitHub หรือคำสั่ง shell เริ่มเซสชันใหม่ใน
แชตที่ได้รับผลกระทบด้วย `/new` หรือ `/reset` แล้วลองคำสั่งที่ไม่ก่อผลกระทบอีกครั้ง หากคำสั่งนั้น
ทำงานได้หนึ่งครั้งแต่การเรียกเครื่องมือเนทีฟครั้งถัดไปล้มเหลวอีก ให้ถือว่า `/new` เป็นเพียงวิธีแก้ชั่วคราวเท่านั้น:
คัดลอกพรอมป์ไปยังเซสชันใหม่หลังจากรีสตาร์ต Codex
app-server หรือ OpenClaw Gateway เพื่อให้เธรดเก่าถูกลบทิ้งและมีการสร้างการลงทะเบียน native hook
ขึ้นใหม่

**โมเดลที่ไม่ใช่ Codex ใช้ harness ในตัว:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่
นโยบาย runtime ของ provider หรือโมเดลจะ route ไปยัง harness อื่น provider ref แบบธรรมดาที่ไม่ใช่ OpenAI
จะยังอยู่บนเส้นทาง provider ปกติในโหมด `auto`

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงานว่า
`Native hook relay unavailable` ให้ใช้การกู้คืน native hook relay ด้านบน ดู
[Codex Computer Use](/th/plugins/codex-computer-use#troubleshooting)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)
- [runtime ของ Codex harness](/th/plugins/codex-harness-runtime)
- [Plugin เนทีฟของ Codex](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [runtime ของ Agent](/th/concepts/agent-runtimes)
- [provider ของโมเดล](/th/concepts/model-providers)
- [provider OpenAI](/th/providers/openai)
- [ความช่วยเหลือ OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness ของ Agent](/th/plugins/sdk-agent-harness)
- [hook ของ Plugin](/th/plugins/hooks)
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
- [สถานะ](/th/cli/status)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
