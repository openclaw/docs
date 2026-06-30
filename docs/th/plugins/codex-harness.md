---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่า Codex harness
    - คุณต้องการให้การปรับใช้แบบ Codex เท่านั้นล้มเหลวแทนที่จะย้อนกลับไปใช้ OpenClaw
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่รวมมาให้
title: ฮาร์เนสของ Codex
x-i18n:
    generated_at: "2026-06-30T14:34:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่มาพร้อมชุดติดตั้งช่วยให้ OpenClaw เรียกใช้รอบเอเจนต์ OpenAI แบบฝังตัว
ผ่าน Codex app-server แทน harness OpenClaw ในตัว

ใช้ Codex harness เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับต่ำ:
การดำเนินเธรดต่อแบบเนทีฟ, การดำเนินเครื่องมือต่อแบบเนทีฟ, Compaction แบบเนทีฟ และ
การดำเนินงานของ app-server OpenClaw ยังเป็นเจ้าของช่องทางแชต, ไฟล์เซสชัน, การเลือกโมเดล,
เครื่องมือไดนามิกของ OpenClaw, การอนุมัติ, การส่งมอบสื่อ และสำเนาทรานสคริปต์ที่มองเห็นได้

การตั้งค่าปกติใช้ refs โมเดล OpenAI แบบมาตรฐาน เช่น `openai/gpt-5.5`
อย่ากำหนดค่า refs GPT ของ Codex แบบเก่า วางลำดับ auth ของเอเจนต์ OpenAI
ไว้ใต้ `auth.order.openai`; ids โปรไฟล์ auth ของ Codex แบบเก่า และ
รายการลำดับ auth ของ Codex แบบเก่าเป็นสถานะเดิมที่ซ่อมแซมโดย
`openclaw doctor --fix`

เมื่อไม่มี sandbox ของ OpenClaw ทำงานอยู่ OpenClaw จะเริ่มเธรด Codex app-server
โดยเปิดใช้โหมดโค้ดเนทีฟของ Codex พร้อมกับปล่อยให้ code-mode-only ปิดไว้ตามค่าเริ่มต้น
สิ่งนี้ทำให้ workspace เนทีฟและความสามารถด้านโค้ดของ Codex พร้อมใช้งาน ขณะที่
เครื่องมือไดนามิกของ OpenClaw ยังคงดำเนินต่อผ่านบริดจ์ `item/tool/call` ของ app-server
sandboxing ของ OpenClaw ที่ทำงานอยู่และนโยบายเครื่องมือแบบจำกัดจะปิดโหมดโค้ดเนทีฟ
ทั้งหมด เว้นแต่คุณจะเลือกใช้เส้นทาง exec-server ของ sandbox แบบทดลอง

ฟีเจอร์แบบ Codex-native นี้แยกจาก
[โหมดโค้ดของ OpenClaw](/th/reference/code-mode) ซึ่งเป็นรันไทม์ QuickJS-WASI
แบบเลือกใช้เองสำหรับการรัน OpenClaw ทั่วไปที่มีรูปแบบอินพุต `exec` ต่างกัน

สำหรับภาพรวมการแยกโมเดล/ผู้ให้บริการ/รันไทม์ ให้เริ่มที่
[รันไทม์เอเจนต์](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คือ ref โมเดล, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` แบบมาพร้อมชุดติดตั้งพร้อมใช้งาน
- หาก config ของคุณใช้ `plugins.allow` ให้รวม `codex`
- Codex app-server `0.125.0` หรือใหม่กว่า Plugin ที่มาพร้อมชุดติดตั้งจะจัดการไบนารี
  Codex app-server ที่เข้ากันได้ตามค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH` จะไม่
  ส่งผลต่อการเริ่ม harness ตามปกติ
- มี auth ของ Codex ผ่าน `openclaw models auth login --provider openai`,
  บัญชี app-server ใน Codex home ของเอเจนต์ หรือโปรไฟล์ auth API-key ของ Codex แบบชัดเจน

สำหรับลำดับความสำคัญของ auth, การแยกสภาพแวดล้อม, คำสั่ง app-server แบบกำหนดเอง, การค้นพบโมเดล
และฟิลด์ config ทั้งหมด โปรดดู
[ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## เริ่มต้นอย่างรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ Codex ใน OpenClaw ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครสมาชิก ChatGPT/Codex, เปิดใช้ Plugin `codex` ที่มาพร้อมชุดติดตั้ง และใช้
ref โมเดล `openai/gpt-*` แบบมาตรฐาน

ลงชื่อเข้าใช้ด้วย Codex OAuth:

```bash
openclaw models auth login --provider openai
```

เปิดใช้ Plugin `codex` ที่มาพร้อมชุดติดตั้งและเลือกโมเดลเอเจนต์ OpenAI:

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

รีสตาร์ท Gateway หลังเปลี่ยน config ของ Plugin หากแชตที่มีอยู่มีเซสชันอยู่แล้ว
ให้ใช้ `/new` หรือ `/reset` ก่อนทดสอบการเปลี่ยนแปลงรันไทม์ เพื่อให้รอบถัดไป
resolve harness จาก config ปัจจุบัน

## การกำหนดค่า

config เริ่มต้นอย่างรวดเร็วคือ config Codex harness ขั้นต่ำที่ใช้งานได้ ตั้งค่าตัวเลือก Codex
harness ใน config ของ OpenClaw และใช้ CLI สำหรับ auth ของ Codex เท่านั้น:

| ความต้องการ                                   | ตั้งค่า                                                                              | ตำแหน่ง                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| เปิดใช้ harness                     | `plugins.entries.codex.enabled: true`                                            | config ของ OpenClaw                    |
| เก็บการติดตั้ง Plugin ที่อยู่ใน allowlist     | รวม `codex` ใน `plugins.allow`                                               | config ของ OpenClaw                    |
| กำหนดเส้นทางรอบเอเจนต์ OpenAI ผ่าน Codex | `agents.defaults.model` หรือ `agents.list[].model` เป็น `openai/gpt-*`               | config เอเจนต์ OpenClaw              |
| ลงชื่อเข้าใช้ด้วย ChatGPT/Codex OAuth       | `openclaw models auth login --provider openai`                                   | โปรไฟล์ auth ของ CLI                   |
| เพิ่ม API-key สำรองสำหรับการรัน Codex      | โปรไฟล์ API-key `openai:*` ที่อยู่หลัง auth แบบสมัครสมาชิกใน `auth.order.openai` | โปรไฟล์ auth ของ CLI + config ของ OpenClaw |
| ปิดแบบ fail closed เมื่อ Codex ใช้งานไม่ได้  | `agentRuntime.id: "codex"` ของผู้ให้บริการหรือโมเดล                                     | config โมเดล/ผู้ให้บริการ OpenClaw     |
| ใช้ทราฟฟิก OpenAI API โดยตรง          | `agentRuntime.id: "openclaw"` ของผู้ให้บริการหรือโมเดล พร้อม auth OpenAI ปกติ          | config โมเดล/ผู้ให้บริการ OpenClaw     |
| ปรับแต่งพฤติกรรม app-server               | `plugins.entries.codex.config.appServer.*`                                       | config Plugin Codex                |
| เปิดใช้แอป Plugin เนทีฟของ Codex        | `plugins.entries.codex.config.codexPlugins.*`                                    | config Plugin Codex                |
| เปิดใช้ Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | config Plugin Codex                |

ใช้ refs โมเดล `openai/gpt-*` สำหรับรอบเอเจนต์ OpenAI ที่สนับสนุนโดย Codex ควรใช้
`auth.order.openai` สำหรับการจัดลำดับแบบ subscription-first/API-key-backup โปรไฟล์ auth
Codex แบบเก่าที่มีอยู่และลำดับ auth ของ Codex แบบเก่าเป็นสถานะเดิมสำหรับ doctor เท่านั้น;
อย่าเขียน refs GPT ของ Codex แบบเก่าใหม่

อย่าตั้งค่า `compaction.model` หรือ `compaction.provider` บนเอเจนต์ที่สนับสนุนโดย Codex
Codex ทำ Compaction ผ่านสถานะเธรด app-server เนทีฟของตัวเอง ดังนั้น OpenClaw จะเพิกเฉย
ต่อการแทนที่ summarizer ในเครื่องเหล่านั้นขณะรันไทม์ และ `openclaw doctor --fix` จะลบออก
เมื่อเอเจนต์ใช้ Codex

Lossless ยังคงรองรับในฐานะเอนจินบริบทสำหรับการประกอบ, การนำเข้า และ
การบำรุงรักษารอบ Codex กำหนดค่าผ่าน
`plugins.slots.contextEngine: "lossless-claw"` และ
`plugins.entries.lossless-claw.config.summaryModel` ไม่ใช่ผ่าน
`agents.defaults.compaction.provider` `openclaw doctor --fix` จะย้ายรูปแบบเดิม
`compaction.provider: "lossless-claw"` ไปยังสล็อต context-engine ของ Lossless
เมื่อ Codex เป็นรันไทม์ที่ทำงานอยู่ แต่ Codex เนทีฟยังคงเป็นเจ้าของ Compaction

Codex app-server harness แบบเนทีฟรองรับเอนจินบริบทที่ต้องมี
การประกอบ pre-prompt แบ็กเอนด์ CLI ทั่วไป รวมถึง `codex-cli` ไม่ได้ให้
ความสามารถของโฮสต์นั้น

สำหรับเอเจนต์ที่สนับสนุนโดย Codex, `/compact` จะเริ่ม Compaction ของ Codex app-server แบบเนทีฟบน
เธรดที่ผูกไว้ OpenClaw จะไม่รอให้เสร็จสิ้น, บังคับใช้ timeout ของ OpenClaw,
รีสตาร์ท app-server ที่แชร์อยู่ หรือ fallback ไปยัง context-engine หรือ
summarizer OpenAI สาธารณะ หากการผูกเธรด Codex แบบเนทีฟหายไปหรือ
เก่า คำสั่งจะ fail closed เพื่อให้ผู้ดำเนินการเห็นขอบเขตรันไทม์จริง
แทนที่จะสลับ backend ของ Compaction อย่างเงียบ ๆ

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ในรูปแบบนั้น ทั้งสองโปรไฟล์ยังคงทำงานผ่าน Codex สำหรับรอบเอเจนต์ `openai/gpt-*`
API key เป็นเพียง auth fallback ไม่ใช่คำขอให้สลับไปใช้ OpenClaw หรือ
OpenAI Responses แบบธรรมดา

ส่วนที่เหลือของหน้านี้ครอบคลุมตัวเลือกทั่วไปที่ผู้ใช้ต้องเลือกระหว่าง:
รูปแบบการปรับใช้, การกำหนดเส้นทางแบบ fail-closed, นโยบายการอนุมัติ guardian, Plugin
เนทีฟของ Codex และ Computer Use สำหรับรายการตัวเลือกทั้งหมด, ค่าเริ่มต้น, enums, การค้นพบ,
การแยกสภาพแวดล้อม, timeouts และฟิลด์การขนส่งของ app-server โปรดดู
[ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## ตรวจสอบรันไทม์ Codex

ใช้ `/status` ในแชตที่คุณคาดว่าจะเป็น Codex รอบเอเจนต์ OpenAI ที่สนับสนุนโดย Codex
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
และ skills `/codex models` แสดงแค็ตตาล็อก Codex app-server สดสำหรับ
harness และบัญชี หาก `/status` ไม่เป็นไปตามคาด โปรดดู
[การแก้ไขปัญหา](#troubleshooting)

## การกำหนดเส้นทางและการเลือกโมเดล

แยก refs ผู้ให้บริการและนโยบายรันไทม์ออกจากกัน:

- ใช้ `openai/gpt-*` สำหรับรอบเอเจนต์ OpenAI ผ่าน Codex
- อย่าใช้ refs GPT ของ Codex แบบเก่าใน config เรียกใช้ `openclaw doctor --fix` เพื่อ
  ซ่อมแซม refs แบบเก่าและ session route pins ที่ค้างอยู่
- `agentRuntime.id: "codex"` เป็นทางเลือกสำหรับโหมด OpenAI อัตโนมัติปกติ แต่มีประโยชน์
  เมื่อการปรับใช้ควร fail closed หาก Codex ไม่พร้อมใช้งาน
- `agentRuntime.id: "openclaw"` เลือกให้ผู้ให้บริการหรือโมเดลใช้รันไทม์
  แบบฝังตัวของ OpenClaw เมื่อเป็นความตั้งใจ
- `/codex ...` ควบคุมการสนทนา Codex app-server แบบเนทีฟจากแชต
- ACP/acpx เป็นเส้นทาง harness ภายนอกที่แยกต่างหาก ใช้เฉพาะเมื่อผู้ใช้ขอ
  ACP/acpx หรืออะแดปเตอร์ harness ภายนอก

การกำหนดเส้นทางคำสั่งทั่วไป:

| เจตนาของผู้ใช้                                           | ใช้                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| แนบแชตปัจจุบัน                               | `/codex bind [--cwd <path>]`                                                                          |
| ดำเนินเธรด Codex ที่มีอยู่ต่อ                       | `/codex resume <thread-id>`                                                                           |
| แสดงรายการหรือกรองเธรด Codex                          | `/codex threads [filter]`                                                                             |
| แสดงรายการ Plugin เนทีฟของ Codex                             | `/codex plugins list`                                                                                 |
| เปิดใช้หรือปิดใช้ Plugin เนทีฟของ Codex ที่กำหนดค่าไว้    | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| แนบเซสชัน Codex CLI ที่มีอยู่บนโหนดที่จับคู่ไว้ | `/codex sessions --host <node> [filter]`, แล้ว `/codex resume <session-id> --host <node> --bind here` |
| ส่ง feedback ของ Codex เท่านั้น                              | `/codex diagnostics [note]`                                                                           |
| เริ่มงาน ACP/acpx                                | คำสั่งเซสชัน ACP/acpx ไม่ใช่ `/codex`                                                               |

| กรณีใช้งาน                                           | กำหนดค่า                                                               | ตรวจสอบ                                 | หมายเหตุ                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| การสมัครสมาชิก ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-*` พร้อมเปิดใช้ `codex` plugin                             | `/status` แสดง `Runtime: OpenAI Codex` | เส้นทางที่แนะนำ                      |
| ล้มเหลวแบบปิดถ้า Codex ไม่พร้อมใช้งาน                | Provider หรือโมเดล `agentRuntime.id: "codex"`                          | เทิร์นล้มเหลวแทนการใช้ fallback แบบฝัง | ใช้สำหรับการปรับใช้เฉพาะ Codex       |
| ส่งทราฟฟิกคีย์ API ของ OpenAI โดยตรงผ่าน OpenClaw     | Provider หรือโมเดล `agentRuntime.id: "openclaw"` และ auth OpenAI ปกติ | `/status` แสดงรันไทม์ OpenClaw        | ใช้เฉพาะเมื่อจงใจใช้ OpenClaw        |
| คอนฟิก legacy                                        | การอ้างอิง GPT ของ Codex แบบ legacy                                    | `openclaw doctor --fix` เขียนใหม่ให้   | อย่าเขียนคอนฟิกใหม่ด้วยวิธีนี้      |
| อะแดปเตอร์ ACP/acpx Codex                            | ACP `sessions_spawn({ runtime: "acp" })`                               | สถานะงาน/เซสชัน ACP                    | แยกจาก Codex harness แบบเนทีฟ        |

`agents.defaults.imageModel` ใช้การแยก prefix แบบเดียวกัน ใช้ `openai/gpt-*`
สำหรับเส้นทาง OpenAI ปกติ และใช้ `codex/gpt-*` เฉพาะเมื่อการเข้าใจภาพ
ควรรันผ่านเทิร์น app-server ของ Codex ที่มีขอบเขตจำกัด อย่าใช้
การอ้างอิง GPT ของ Codex แบบ legacy; doctor จะเขียน prefix legacy นั้นใหม่เป็น `openai/gpt-*`

## รูปแบบการปรับใช้

### การปรับใช้ Codex พื้นฐาน

ใช้คอนฟิก quickstart เมื่อทุกเทิร์นของเอเจนต์ OpenAI ควรใช้ Codex เป็น
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

### การปรับใช้ Provider แบบผสม

รูปแบบนี้คง Claude ไว้เป็นเอเจนต์ค่าเริ่มต้นและเพิ่มเอเจนต์ Codex ที่มีชื่อ:

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

ด้วยคอนฟิกนี้ เอเจนต์ `main` ใช้เส้นทาง Provider ปกติของตัวเอง และเอเจนต์
`codex` ใช้ app-server ของ Codex

### การปรับใช้ Codex แบบ fail-closed

สำหรับเทิร์นของเอเจนต์ OpenAI, `openai/gpt-*` จะ resolve ไปยัง Codex อยู่แล้วเมื่อ
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

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก plugin Codex ถูกปิดใช้,
app-server เก่าเกินไป, หรือ app-server เริ่มทำงานไม่ได้

## นโยบาย app-server

ตามค่าเริ่มต้น plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการไว้ในเครื่องด้วย
transport แบบ stdio ตั้งค่า `appServer.command` เฉพาะเมื่อคุณจงใจต้องการรัน
ไฟล์ปฏิบัติการอื่น ใช้ transport แบบ WebSocket เฉพาะเมื่อมี app-server
กำลังรันอยู่ที่อื่นแล้ว:

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

เซสชัน app-server แบบ local stdio มีค่าเริ่มต้นเป็นท่าทางผู้ปฏิบัติการในเครื่องที่เชื่อถือได้:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, และ
`sandbox: "danger-full-access"` หากข้อกำหนด Codex ในเครื่องไม่อนุญาต
ท่าทาง YOLO โดยนัยนั้น OpenClaw จะเลือกสิทธิ์ guardian ที่อนุญาตแทน
เมื่อ sandbox ของ OpenClaw ทำงานอยู่สำหรับเซสชัน OpenClaw จะปิดใช้งาน
Code Mode แบบเนทีฟของ Codex, เซิร์ฟเวอร์ MCP ของผู้ใช้, และการดำเนินการ plugin ที่มีแอปหนุนหลังสำหรับ
เทิร์นนั้น แทนการพึ่งพา sandboxing ฝั่งโฮสต์ของ Codex การเข้าถึง shell จะถูกเปิดให้ใช้
ผ่านเครื่องมือแบบไดนามิกที่มี sandbox ของ OpenClaw รองรับ เช่น `sandbox_exec` และ
`sandbox_process` เมื่อเครื่องมือ exec/process ปกติพร้อมใช้งาน

ใช้โหมด exec ที่ทำให้เป็นมาตรฐานของ OpenClaw เมื่อคุณต้องการ auto-review แบบเนทีฟของ Codex ก่อน
การหลุดออกจาก sandbox หรือสิทธิ์เพิ่มเติม:

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

สำหรับเซสชัน app-server ของ Codex, OpenClaw จะแมป `tools.exec.mode: "auto"` ไปยังการอนุมัติ
ที่ Codex Guardian ตรวจทาน โดยปกติคือ
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, และ
`sandbox: "workspace-write"` เมื่อข้อกำหนดในเครื่องอนุญาตค่าเหล่านั้น
ใน `tools.exec.mode: "auto"`, OpenClaw จะไม่คง override แบบ Codex legacy ที่ไม่ปลอดภัยอย่าง
`approvalPolicy: "never"` หรือ `sandbox: "danger-full-access"`; ใช้
`tools.exec.mode: "full"` สำหรับท่าทาง Codex แบบไม่มีการอนุมัติโดยตั้งใจ
preset legacy `plugins.entries.codex.config.appServer.mode: "guardian"` ยัง
ใช้งานได้ แต่ `tools.exec.mode: "auto"` คือพื้นผิว OpenClaw ที่ทำให้เป็นมาตรฐานแล้ว

สำหรับการเปรียบเทียบระดับโหมดกับการอนุมัติ host exec และสิทธิ์ ACPX,
ดู [โหมดสิทธิ์](/th/tools/permission-modes)

สำหรับทุกฟิลด์ของ app-server, ลำดับ auth, การแยกสภาพแวดล้อม, discovery, และ
พฤติกรรม timeout, ดู [อ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## คำสั่งและการวินิจฉัย

plugin ที่บันเดิลมาจะลงทะเบียน `/codex` เป็นคำสั่ง slash บนทุกช่องทางที่
รองรับคำสั่งข้อความของ OpenClaw

การดำเนินการและการควบคุมแบบเนทีฟต้องใช้ owner หรือไคลเอนต์ Gateway แบบ `operator.admin`
ซึ่งรวมถึงการ bind หรือ resume เธรด, การส่งหรือหยุดเทิร์น,
การเปลี่ยนโมเดล, fast-mode, หรือสถานะสิทธิ์, การ compact หรือ review, และ
การ detach binding ผู้ส่งที่ได้รับอนุญาตรายอื่นยังคงมีคำสั่งแบบอ่านอย่างเดียวสำหรับสถานะ, ความช่วยเหลือ,
บัญชี, โมเดล, เธรด, เซิร์ฟเวอร์ MCP, skill, และการตรวจสอบ binding

รูปแบบทั่วไป:

- `/codex status` ตรวจสอบการเชื่อมต่อ app-server, โมเดล, บัญชี, ขีดจำกัดอัตรา,
  เซิร์ฟเวอร์ MCP, และ skills
- `/codex models` แสดงรายการโมเดล app-server ของ Codex แบบ live
- `/codex threads [filter]` แสดงรายการเธรด app-server ของ Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับ
  เธรด Codex ที่มีอยู่
- `/codex compact` ขอให้ app-server ของ Codex compact เธรดที่แนบอยู่
- `/codex review` เริ่มการ review แบบเนทีฟของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` จะถามก่อนส่ง feedback ของ Codex สำหรับ
  เธรดที่แนบอยู่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตรา
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของ app-server ของ Codex
- `/codex skills` แสดงรายการ skills ของ app-server ของ Codex

สำหรับรายงานสนับสนุนส่วนใหญ่ ให้เริ่มด้วย `/diagnostics [note]` ในบทสนทนา
ที่เกิดบั๊ก คำสั่งนี้จะสร้างรายงานการวินิจฉัย Gateway หนึ่งรายการ และสำหรับเซสชัน
Codex harness จะขออนุมัติเพื่อส่งบันเดิล feedback ของ Codex ที่เกี่ยวข้อง
ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรม
แชตกลุ่ม

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลด feedback ของ Codex
สำหรับเธรดที่แนบอยู่ปัจจุบันโดยเฉพาะ โดยไม่รวมบันเดิลการวินิจฉัย Gateway
แบบเต็ม

### ตรวจสอบเธรด Codex ในเครื่อง

วิธีที่เร็วที่สุดในการตรวจสอบรัน Codex ที่มีปัญหามักเป็นการเปิดเธรด Codex
แบบเนทีฟโดยตรง:

```bash
codex resume <thread-id>
```

รับ thread id จากการตอบกลับ `/diagnostics` ที่เสร็จสมบูรณ์, `/codex binding`, หรือ
`/codex threads [filter]`

สำหรับกลไกการอัปโหลดและขอบเขตการวินิจฉัยระดับรันไทม์, ดู
[รันไทม์ Codex harness](/th/plugins/codex-harness-runtime#codex-feedback-upload)

Auth จะถูกเลือกตามลำดับนี้:

1. โปรไฟล์ auth ของ OpenAI ที่จัดลำดับไว้สำหรับเอเจนต์ โดยควรอยู่ใต้
   `auth.order.openai` รัน `openclaw doctor --fix` เพื่อ migrate
   id โปรไฟล์ auth ของ Codex แบบ legacy ที่เก่ากว่า และลำดับ auth ของ Codex แบบ legacy
2. บัญชีที่มีอยู่ของ app-server ใน Codex home ของเอเจนต์นั้น
3. เฉพาะการเปิด app-server แบบ local stdio เท่านั้น, `CODEX_API_KEY`, จากนั้น
   `OPENAI_API_KEY`, เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้ auth OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์ auth ของ Codex แบบการสมัครสมาชิก ChatGPT, ระบบจะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ spawn ขึ้น
สิ่งนี้ทำให้คีย์ API ระดับ Gateway ยังพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้เทิร์น app-server ของ Codex แบบเนทีฟถูกคิดเงินผ่าน API โดยไม่ตั้งใจ
โปรไฟล์คีย์ API ของ Codex แบบชัดเจนและ fallback คีย์ env แบบ local stdio ใช้การเข้าสู่ระบบ
app-server แทนการสืบทอด env ของกระบวนการลูก การเชื่อมต่อ app-server แบบ WebSocket
จะไม่ได้รับ fallback คีย์ API จาก env ของ Gateway; ใช้โปรไฟล์ auth แบบชัดเจนหรือ
บัญชีของ app-server ระยะไกลเอง
เมื่อกำหนดค่า plugin Codex แบบเนทีฟไว้ OpenClaw จะติดตั้งหรือรีเฟรช plugin เหล่านั้น
ผ่าน app-server ที่เชื่อมต่ออยู่ก่อนเปิดเผยแอปที่ plugin เป็นเจ้าของให้กับ
เธรด Codex `app/list` ยังคงเป็นแหล่งความจริงสำหรับ app ids,
การเข้าถึงได้, และ metadata แต่ OpenClaw เป็นเจ้าของการตัดสินใจ enablement รายเธรด:
หากนโยบายอนุญาตแอปที่เข้าถึงได้ซึ่งอยู่ในรายการ OpenClaw จะส่ง
`thread/start.config.apps[appId].enabled = true` แม้ว่า `app/list` ในปัจจุบันจะ
รายงานว่าแอปนั้นถูกปิดใช้งานอยู่ก็ตาม เส้นทางนี้ไม่ได้สร้างการติดตั้งแอปสำหรับ
id ที่ไม่รู้จักขึ้นมาเอง; OpenClaw จะเปิดใช้งานเฉพาะ marketplace plugins ด้วย `plugin/install`
แล้วจึงรีเฟรช inventory

หากโปรไฟล์การสมัครสมาชิกชนขีดจำกัดการใช้งาน Codex, OpenClaw จะบันทึกเวลา reset
เมื่อ Codex รายงานมา และลองโปรไฟล์ auth ถัดไปที่จัดลำดับไว้สำหรับรัน Codex เดียวกัน
เมื่อพ้นเวลา reset แล้ว โปรไฟล์การสมัครสมาชิกจะมีสิทธิ์ใช้งานอีกครั้ง
โดยไม่เปลี่ยนโมเดล `openai/gpt-*` ที่เลือกหรือรันไทม์ Codex

สำหรับการเปิด app-server แบบ local stdio, OpenClaw จะตั้งค่า `CODEX_HOME` เป็นไดเรกทอรี
รายเอเจนต์ เพื่อให้คอนฟิก Codex, ไฟล์ auth/บัญชี, cache/data ของ plugin, และสถานะ
เธรดแบบเนทีฟไม่อ่านหรือเขียน `~/.codex` ส่วนตัวของผู้ปฏิบัติการตามค่าเริ่มต้น
OpenClaw จะคงค่า `HOME` ของกระบวนการปกติไว้; subprocesses ที่ Codex รัน
ยังสามารถค้นหาคอนฟิกและโทเคนใน user-home ได้ และ Codex อาจค้นพบรายการ
`$HOME/.agents/skills` และ `$HOME/.agents/plugins/marketplace.json` ที่ใช้ร่วมกัน

หากการปรับใช้ต้องการการแยกสภาพแวดล้อมเพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นลงใน
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

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูก app-server ของ Codex ที่ spawn ขึ้น
OpenClaw จะลบ `CODEX_HOME` และ `HOME` ออกจากรายการนี้ระหว่างการทำให้การเปิดในเครื่องเป็นมาตรฐาน:
`CODEX_HOME` ยังคงเป็นรายเอเจนต์ และ `HOME` ยังคงสืบทอดมาเพื่อให้
subprocesses ใช้สถานะ user-home ปกติได้

เครื่องมือแบบไดนามิกของ Codex โหลดแบบ `searchable` เป็นค่าเริ่มต้น OpenClaw จะไม่เปิดเผย
เครื่องมือแบบไดนามิกที่ซ้ำกับการดำเนินการพื้นที่ทำงานแบบเนทีฟของ Codex ได้แก่ `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` และ `update_plan` เครื่องมือผสานรวมของ
OpenClaw ส่วนใหญ่ที่เหลือ เช่น การส่งข้อความ, สื่อ, Cron, เบราว์เซอร์, โหนด,
Gateway และ `heartbeat_respond` พร้อมใช้งานผ่านการค้นหาเครื่องมือของ Codex ภายใต้
เนมสเปซ `openclaw` ซึ่งช่วยให้บริบทโมเดลเริ่มต้นเล็กลง การค้นหาเว็บ
ใช้เครื่องมือ `web_search` แบบโฮสต์ของ Codex เป็นค่าเริ่มต้นเมื่อเปิดใช้งานการค้นหาและไม่ได้
เลือกผู้ให้บริการที่จัดการ การค้นหาแบบโฮสต์เนทีฟและเครื่องมือแบบไดนามิก
`web_search` ที่จัดการโดย OpenClaw ใช้ร่วมกันไม่ได้ เพื่อให้การค้นหาที่จัดการไม่สามารถข้าม
ข้อจำกัดโดเมนแบบเนทีฟได้ OpenClaw ใช้เครื่องมือที่จัดการเมื่อการค้นหาแบบโฮสต์
ไม่พร้อมใช้งาน, ถูกปิดใช้งานอย่างชัดเจน หรือถูกแทนที่ด้วยผู้ให้บริการที่จัดการซึ่งเลือกไว้
OpenClaw ปิดใช้งานส่วนขยาย `web.run` แบบสแตนด์อโลนของ Codex ไว้เสมอ เพราะ
ทราฟฟิก app-server ฝั่งโปรดักชันปฏิเสธเนมสเปซ `web` ที่ผู้ใช้กำหนดเอง
`tools.web.search.enabled: false` จะปิดใช้งานทั้งสองเส้นทาง เช่นเดียวกับการรันแบบ
LLM-only ที่ปิดเครื่องมือ Codex ถือว่า `"cached"` เป็นการตั้งค่าเชิงความต้องการและแปลงเป็น
การเข้าถึงภายนอกแบบสดสำหรับเทิร์น app-server ที่ไม่จำกัด การย้อนกลับไปใช้การจัดการโดยอัตโนมัติ
จะล้มเหลวแบบปิดเมื่อมีการตั้งค่า `allowedDomains` แบบเนทีฟ เพื่อไม่ให้ข้ามรายการอนุญาตได้
การเปลี่ยนแปลงนโยบายการค้นหาที่มีผลและคงอยู่ถาวรจะหมุนเธรด Codex ที่ผูกไว้
ก่อนเทิร์นถัดไป ข้อจำกัดชั่วคราวแบบรายเทิร์นจะใช้เธรดที่ถูกจำกัดชั่วคราว
และรักษาการผูกเดิมไว้สำหรับการกลับมาทำงานต่อในภายหลัง
`sessions_yield` และคำตอบจากซอร์สแบบใช้เฉพาะเครื่องมือข้อความยังคงส่งโดยตรง เพราะ
สิ่งเหล่านั้นเป็นสัญญาการควบคุมเทิร์น `sessions_spawn` ยังคงค้นหาได้เพื่อให้
`spawn_agent` แบบเนทีฟของ Codex ยังคงเป็นพื้นผิวซับเอเจนต์หลักของ Codex ขณะที่การมอบหมายงาน
ผ่าน OpenClaw หรือ ACP อย่างชัดเจนยังคงพร้อมใช้งานผ่านเนมสเปซเครื่องมือแบบไดนามิก
`openclaw` คำแนะนำการทำงานร่วมกันของ Heartbeat บอกให้ Codex ค้นหา
`heartbeat_respond` ก่อนจบเทิร์น Heartbeat เมื่อเครื่องมือยังไม่ได้โหลดไว้

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับ
app-server ของ Codex แบบกำหนดเองที่ไม่สามารถค้นหาเครื่องมือแบบไดนามิกที่เลื่อนไว้ได้
หรือเมื่อดีบักเพย์โหลดเครื่องมือทั้งหมด

ฟิลด์ Plugin ของ Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น        | ความหมาย                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | ใช้ `"direct"` เพื่อใส่เครื่องมือแบบไดนามิกของ OpenClaw ลงในบริบทเครื่องมือ Codex เริ่มต้นโดยตรง |
| `codexDynamicToolsExclude` | `[]`           | ชื่อเครื่องมือแบบไดนามิกเพิ่มเติมของ OpenClaw ที่จะละเว้นจากเทิร์น app-server ของ Codex              |
| `codexPlugins`             | ปิดใช้งาน       | การรองรับ Plugin/แอปแบบเนทีฟของ Codex สำหรับ Plugin ที่คัดสรรซึ่งติดตั้งจากซอร์สและย้ายมาแล้ว           |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` จะเรียกใช้ Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | ไบนารี Codex ที่จัดการให้                                   | ไฟล์ปฏิบัติการสำหรับทรานสปอร์ต stdio เว้นว่างไว้เพื่อใช้ไบนารีที่จัดการให้; ตั้งค่าเฉพาะเมื่อต้องการแทนที่อย่างชัดเจน                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับทรานสปอร์ต stdio                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | ไม่ได้ตั้งค่า                                                  | URL ของ WebSocket app-server                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | ไม่ได้ตั้งค่า                                                  | โทเค็น Bearer สำหรับทรานสปอร์ต WebSocket รับได้ทั้งสตริงตรงตัวหรือ SecretInput เช่น `${CODEX_APP_SERVER_TOKEN}`                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | เฮดเดอร์ WebSocket เพิ่มเติม ค่าเฮดเดอร์รับได้ทั้งสตริงตรงตัวหรือค่า SecretInput เช่น `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะถูกลบออกจากกระบวนการ stdio app-server ที่ถูกเรียกใช้ หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว OpenClaw เก็บ `CODEX_HOME` แบบต่อเอเจนต์และ `HOME` ที่สืบทอดมาสำหรับการเรียกใช้ในเครื่อง                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | เลือกใช้พื้นผิวเครื่องมือเฉพาะโหมดโค้ดของ Codex เครื่องมือแบบไดนามิกของ OpenClaw ยังคงลงทะเบียนกับ Codex เพื่อให้การเรียก `tools.*` แบบซ้อนส่งคืนผ่านบริดจ์ `item/tool/call` ของ app-server                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | ไม่ได้ตั้งค่า                                                  | รูทเวิร์กสเปซของ Codex app-server ระยะไกล เมื่อตั้งค่าแล้ว OpenClaw จะอนุมานรูทเวิร์กสเปซในเครื่องจากเวิร์กสเปซ OpenClaw ที่แก้ค่าได้ รักษาส่วนต่อท้าย cwd ปัจจุบันภายใต้รูทระยะไกลนี้ และส่งเฉพาะ cwd สุดท้ายของ app-server ไปยัง Codex หาก cwd อยู่นอกรูทเวิร์กสเปซ OpenClaw ที่แก้ค่าได้ OpenClaw จะปิดแบบปลอดภัยแทนการส่งพาธภายใน Gateway ไปยัง app-server ระยะไกล |
| `requestTimeoutMs`                            | `60000`                                                | ระยะหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | ช่วงเงียบหลังจาก Codex รับเทิร์น หรือหลังคำขอ app-server ที่จำกัดขอบเขตตามเทิร์น ขณะที่ OpenClaw รอ `turn/completed`                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ตัวเฝ้าระวังช่วงว่างของการเสร็จสิ้นและความคืบหน้าที่ใช้หลังการส่งต่อเครื่องมือ การเสร็จสิ้นของเครื่องมือเนทีฟ ความคืบหน้าของผู้ช่วยดิบหลังใช้เครื่องมือ การเสร็จสิ้นของการให้เหตุผลดิบ หรือความคืบหน้าของการให้เหตุผล ขณะที่ OpenClaw รอ `turn/completed` ใช้ค่านี้สำหรับงานที่เชื่อถือได้หรืองานหนักซึ่งการสังเคราะห์หลังใช้เครื่องมือสามารถเงียบได้นานกว่างบเวลาปล่อยผู้ช่วยสุดท้ายอย่างสมเหตุสมผล                                |
| `mode`                                        | `"yolo"` เว้นแต่ข้อกำหนดของ Codex ในเครื่องไม่อนุญาต YOLO | พรีเซ็ตสำหรับการดำเนินการแบบ YOLO หรือแบบให้ guardian ตรวจทาน ข้อกำหนด stdio ในเครื่องที่ละเว้น `danger-full-access`, การอนุมัติ `never` หรือผู้ตรวจทาน `user` จะทำให้ค่าเริ่มต้นโดยนัยเป็น guardian                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` หรือนโยบายการอนุมัติ guardian ที่อนุญาต       | นโยบายการอนุมัติเนทีฟของ Codex ที่ส่งไปยังการเริ่ม/ดำเนินต่อ/เทิร์นของเธรด ค่าเริ่มต้นของ guardian จะเลือก `"on-request"` เมื่ออนุญาต                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` หรือแซนด์บ็อกซ์ guardian ที่อนุญาต  | โหมดแซนด์บ็อกซ์เนทีฟของ Codex ที่ส่งไปยังการเริ่ม/ดำเนินต่อของเธรด ค่าเริ่มต้นของ guardian จะเลือก `"workspace-write"` เมื่ออนุญาต ไม่เช่นนั้นจะใช้ `"read-only"` เมื่อแซนด์บ็อกซ์ OpenClaw ทำงานอยู่ เทิร์น `danger-full-access` จะใช้ Codex `workspace-write` พร้อมการเข้าถึงเครือข่ายที่ได้จากการตั้งค่า egress ของแซนด์บ็อกซ์ OpenClaw                                                                                     |
| `approvalsReviewer`                           | `"user"` หรือผู้ตรวจทาน guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทานพรอมป์การอนุมัติเนทีฟเมื่ออนุญาต ไม่เช่นนั้นใช้ `guardian_subagent` หรือ `user` โดย `guardian_subagent` ยังคงเป็นนามแฝงเดิม                                                                                                                                                                                                                              |
| `serviceTier`                                 | ไม่ได้ตั้งค่า                                                  | ระดับบริการ Codex app-server แบบไม่บังคับ `"priority"` เปิดใช้การกำหนดเส้นทางโหมดเร็ว, `"flex"` ขอการประมวลผลแบบ flex, `null` ล้างการแทนที่ และ `"fast"` แบบเดิมจะถูกรับเป็น `"priority"`                                                                                                                                                                                                 |
| `networkProxy`                                | ปิดใช้งาน                                               | เลือกใช้เครือข่ายโปรไฟล์สิทธิ์ของ Codex สำหรับคำสั่ง app-server OpenClaw จะกำหนดคอนฟิก `permissions.<profile>.network` ที่เลือก และเลือกด้วย `default_permissions` แทนการส่ง `sandbox`                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | การเลือกใช้ฟีเจอร์พรีวิวที่ลงทะเบียนสภาพแวดล้อม Codex ที่หนุนด้วยแซนด์บ็อกซ์ OpenClaw กับ Codex app-server 0.132.0 หรือใหม่กว่า เพื่อให้การดำเนินการเนทีฟของ Codex สามารถทำงานภายในแซนด์บ็อกซ์ OpenClaw ที่ใช้งานอยู่                                                                                                                                                                                                         |

`appServer.networkProxy` เป็นการตั้งค่าอย่างชัดเจน เพราะมันเปลี่ยนสัญญาแซนด์บ็อกซ์ของ Codex
เมื่อเปิดใช้ OpenClaw จะตั้งค่า `features.network_proxy.enabled` และ
`default_permissions` ในคอนฟิกเธรดของ Codex ด้วย เพื่อให้โปรไฟล์สิทธิ์ที่สร้างขึ้น
สามารถเริ่มเครือข่ายที่ Codex จัดการได้ โดยค่าเริ่มต้น OpenClaw จะสร้าง
ชื่อโปรไฟล์ `openclaw-network-<fingerprint>` ที่ทนต่อการชนกันจากเนื้อหาโปรไฟล์;
ใช้ `profileName` เฉพาะเมื่อต้องการชื่อในเครื่องที่คงที่

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

หากรันไทม์ app-server ปกติจะเป็น `danger-full-access` การเปิดใช้
`networkProxy` จะใช้การเข้าถึงระบบไฟล์แบบเวิร์กสเปซสำหรับโปรไฟล์สิทธิ์
ที่สร้างขึ้น การบังคับใช้เครือข่ายที่ Codex จัดการเป็นเครือข่ายแบบแซนด์บ็อกซ์
ดังนั้นโปรไฟล์ที่เข้าถึงได้เต็มรูปแบบจะไม่ปกป้องทราฟฟิกขาออก
รายการโดเมนใช้ `allow` หรือ `deny`; รายการ Unix socket ใช้ค่า
`allow` หรือ `none` ของ Codex

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` ใช้ watchdog ของ
OpenClaw ค่าเริ่มต้น 90 วินาที อาร์กิวเมนต์ `timeoutMs` ต่อการเรียกที่เป็นค่าบวกจะขยาย
หรือลดงบเวลาของเครื่องมือนั้นโดยเฉพาะ เครื่องมือ `image_generate` ใช้
`agents.defaults.imageGenerationModel.timeoutMs` เมื่อการเรียกเครื่องมือไม่ได้
ระบุ timeout ของตัวเอง หรือใช้ค่าเริ่มต้นสำหรับการสร้างภาพ 120 วินาทีในกรณีอื่น
เครื่องมือ `image` สำหรับการทำความเข้าใจสื่อใช้
`tools.media.image.timeoutSeconds` หรือค่าเริ่มต้นสำหรับสื่อ 60 วินาที สำหรับการทำความเข้าใจภาพ
timeout นั้นใช้กับตัวคำขอเองและจะไม่ถูก
ลดลงจากงานเตรียมการก่อนหน้า งบเวลาของเครื่องมือแบบไดนามิกถูก
จำกัดสูงสุดที่ 600000 ms เมื่อ timeout, OpenClaw จะยกเลิกสัญญาณเครื่องมือ
ในที่ที่รองรับและส่งคืนการตอบกลับเครื่องมือแบบไดนามิกที่ล้มเหลวไปยัง Codex เพื่อให้เทิร์น
ดำเนินต่อได้แทนที่จะปล่อยเซสชันไว้ใน `processing`
watchdog นี้คือขอบเขตงบเวลา `item/tool/call` แบบไดนามิกชั้นนอก; timeout ของคำขอ
เฉพาะ provider จะทำงานอยู่ภายในการเรียกนั้นและคงความหมายของ timeout ของตัวเองไว้

หลังจาก Codex ยอมรับเทิร์น และหลังจาก OpenClaw ตอบกลับคำขอ
app-server ที่มีขอบเขตเทิร์นแล้ว harness คาดว่า Codex จะทำความคืบหน้าในเทิร์นปัจจุบันและ
ท้ายที่สุดจบเทิร์นเนทีฟด้วย `turn/completed` หาก app-server
เงียบไปนาน `appServer.turnCompletionIdleTimeoutMs`, OpenClaw จะพยายาม
ขัดจังหวะเทิร์น Codex อย่างดีที่สุด บันทึก diagnostic timeout และปล่อย
เลนเซสชัน OpenClaw เพื่อไม่ให้ข้อความแชตที่ตามมาถูกต่อคิวหลังเทิร์นเนทีฟที่ค้างอยู่
การแจ้งเตือนที่ไม่ใช่สถานะปลายทางส่วนใหญ่สำหรับเทิร์นเดียวกันจะปลด watchdog สั้นนี้
เพราะ Codex ได้พิสูจน์แล้วว่าเทิร์นยังมีชีวิตอยู่ การส่งต่อเครื่องมือใช้
งบเวลาว่างหลังเครื่องมือที่ยาวกว่า: หลังจาก OpenClaw ส่งคืนการตอบกลับ `item/tool/call`,
หลังจากรายการเครื่องมือเนทีฟเช่น `commandExecution` เสร็จสิ้น, หลังจากการเสร็จสิ้น
`custom_tool_call_output` ดิบ และหลังจากความคืบหน้าของ assistant ดิบหลังเครื่องมือ,
การเสร็จสิ้นของ reasoning ดิบ หรือความคืบหน้าของ reasoning ตัวป้องกันใช้
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` เมื่อมีการตั้งค่า และ
ค่าเริ่มต้นเป็นห้านาทีในกรณีอื่น งบหลังเครื่องมือเดียวกันนั้นยังขยาย
progress watchdog สำหรับหน้าต่าง synthesis เงียบก่อนที่ Codex จะส่งเหตุการณ์
เทิร์นปัจจุบันถัดไป การแจ้งเตือน app-server ระดับ global เช่นการอัปเดต rate-limit
จะไม่รีเซ็ตความคืบหน้า turn-idle การเสร็จสิ้นของ reasoning, การเสร็จสิ้น
`agentMessage` แบบ commentary และความคืบหน้าของ reasoning หรือ assistant ดิบก่อนเครื่องมือ
อาจตามด้วยการตอบกลับสุดท้ายอัตโนมัติ ดังนั้นจึงใช้ตัวป้องกันการตอบกลับหลังความคืบหน้า
แทนที่จะปล่อยเลนเซสชันทันที เฉพาะรายการ `agentMessage` ที่เสร็จสมบูรณ์แบบ
final/non-commentary และการเสร็จสิ้นของ assistant ดิบก่อนเครื่องมือเท่านั้นที่ติดตั้งการปล่อยผลลัพธ์ assistant:
หาก Codex เงียบไปโดยไม่มี `turn/completed`, OpenClaw จะพยายามขัดจังหวะเทิร์นเนทีฟ
และปล่อยเลนเซสชันอย่างดีที่สุด ความล้มเหลวของ stdio app-server ที่ replay-safe รวมถึง
turn-completion idle timeout ที่ไม่มีหลักฐาน assistant, tool, active-item หรือ
side-effect จะถูกลองซ้ำหนึ่งครั้งในการพยายาม app-server ใหม่ timeout ที่ไม่ปลอดภัย
ยังคง retire ไคลเอนต์ app-server ที่ค้างและปล่อยเลนเซสชัน OpenClaw
นอกจากนี้ยังล้างการผูก thread เนทีฟที่ค้างแทนที่จะ replay โดยอัตโนมัติ
Completion-watch timeout แสดงข้อความ timeout เฉพาะ Codex: กรณี replay-safe
จะบอกว่าการตอบกลับอาจไม่สมบูรณ์ ขณะที่กรณีไม่ปลอดภัย
จะบอกให้ผู้ใช้ตรวจสอบสถานะปัจจุบันก่อนลองอีกครั้ง diagnostic timeout สาธารณะ
มีฟิลด์เชิงโครงสร้าง เช่น method การแจ้งเตือน app-server ล่าสุด,
id/type/role ของรายการการตอบกลับ assistant ดิบ, จำนวน request/item ที่ active และสถานะ watch
ที่ติดตั้งอยู่ เมื่อการแจ้งเตือนล่าสุดเป็นรายการการตอบกลับ assistant ดิบ
จะมีตัวอย่างข้อความ assistant แบบจำกัดขนาดด้วย แต่จะไม่รวม prompt ดิบหรือ
เนื้อหาเครื่องมือ

environment override ยังคงพร้อมใช้งานสำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ข้ามไบนารีที่จัดการไว้เมื่อ
ไม่ได้ตั้งค่า `appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว แนะนำให้ใช้ config
สำหรับการ deployment ที่ทำซ้ำได้ เพราะช่วยเก็บพฤติกรรม Plugin ไว้ใน
ไฟล์ที่ผ่านการตรวจทานเดียวกับการตั้งค่า Codex harness ส่วนที่เหลือ

## Plugin Codex เนทีฟ

การรองรับ Plugin Codex เนทีฟใช้ความสามารถ app และ plugin ของ Codex app-server เอง
ใน thread Codex เดียวกับเทิร์น OpenClaw harness OpenClaw
ไม่แปล Plugin Codex เป็นเครื่องมือไดนามิก OpenClaw `codex_plugin_*`
แบบสังเคราะห์

`codexPlugins` มีผลเฉพาะกับเซสชันที่เลือก Codex harness เนทีฟเท่านั้น
ไม่มีผลกับการรัน harness ในตัว, การรัน OpenAI provider ปกติ, การผูกการสนทนา ACP
หรือ harness อื่น

config ที่ migrate ขั้นต่ำ:

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

thread app config จะถูกคำนวณเมื่อ OpenClaw สร้างเซสชัน Codex harness
หรือแทนที่การผูก thread Codex ที่ค้างอยู่ จะไม่คำนวณใหม่ในทุกเทิร์น
หลังจากเปลี่ยน `codexPlugins`, ใช้ `/new`, `/reset` หรือรีสตาร์ท Gateway เพื่อให้
เซสชัน Codex harness ในอนาคตเริ่มด้วยชุด app ที่อัปเดตแล้ว

สำหรับ eligibility การ migration, inventory ของ app, นโยบาย destructive action,
elicitations และ diagnostics ของ Plugin เนทีฟ ดู
[Plugin Codex เนทีฟ](/th/plugins/codex-native-plugins)

การเข้าถึง app และ plugin ฝั่ง OpenAI ถูกควบคุมโดยบัญชี Codex
ที่ลงชื่อเข้าใช้ และสำหรับ workspace แบบ Business และ Enterprise/Edu จะถูกควบคุมโดยการควบคุม app ของ workspace ดู
[การใช้ Codex กับแผน ChatGPT ของคุณ](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
สำหรับภาพรวมบัญชีและการควบคุม workspace ของ OpenAI

## Computer Use

Computer Use ครอบคลุมอยู่ในคู่มือการตั้งค่าของตัวเอง:
[Codex Computer Use](/th/plugins/codex-computer-use)

สรุปสั้น ๆ: OpenClaw ไม่ vendor app ควบคุมเดสก์ท็อปหรือดำเนินการ
desktop actions เอง แต่เตรียม Codex app-server, ตรวจสอบว่า
MCP server `computer-use` พร้อมใช้งาน แล้วให้ Codex เป็นเจ้าของการเรียกเครื่องมือ MCP
เนทีฟระหว่างเทิร์นโหมด Codex

## ขอบเขต runtime

Codex harness เปลี่ยนเฉพาะ executor ของ embedded agent ระดับล่างเท่านั้น

- รองรับเครื่องมือไดนามิกของ OpenClaw Codex ขอให้ OpenClaw ดำเนินการ
  เครื่องมือเหล่านั้น ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการดำเนินการ
- shell, patch, MCP และเครื่องมือ app เนทีฟของ Codex เป็นของ Codex
  OpenClaw สามารถสังเกตหรือบล็อกเหตุการณ์เนทีฟที่เลือกผ่าน relay
  ที่รองรับ แต่จะไม่เขียนอาร์กิวเมนต์ของเครื่องมือเนทีฟใหม่
- Codex เป็นเจ้าของ compaction เนทีฟ OpenClaw เก็บ transcript mirror สำหรับประวัติช่องทาง,
  การค้นหา, `/new`, `/reset` และการสลับ model หรือ harness ในอนาคต แต่
  ไม่แทนที่ compaction ของ Codex ด้วย summarizer ของ OpenClaw หรือ context-engine
- การสร้างสื่อ, การทำความเข้าใจสื่อ, TTS, approvals และผลลัพธ์ messaging-tool
  ยังคงผ่านการตั้งค่า provider/model ของ OpenClaw ที่ตรงกัน
- `tool_result_persist` ใช้กับผลลัพธ์เครื่องมือใน transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่
  record ผลลัพธ์เครื่องมือเนทีฟของ Codex

สำหรับ hook layer, พื้นผิว V1 ที่รองรับ, การจัดการสิทธิ์เนทีฟ, การบังคับทิศทางคิว,
กลไกการอัปโหลด feedback ของ Codex และรายละเอียด compaction ดู
[Codex harness runtime](/th/plugins/codex-harness-runtime)

## การแก้ปัญหา

**Codex ไม่ปรากฏเป็น provider `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ
config ใหม่ เลือก model `openai/gpt-*`, เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้ยกเว้น
`codex`

**OpenClaw ใช้ harness ในตัวแทน Codex:** ตรวจสอบให้แน่ใจว่า model ref เป็น
`openai/gpt-*` บน OpenAI provider ทางการ และติดตั้งพร้อมเปิดใช้ Plugin Codex แล้ว
หากต้องการหลักฐานที่เข้มงวดระหว่างการทดสอบ ให้ตั้ง provider หรือ
model `agentRuntime.id: "codex"` runtime Codex ที่ถูกบังคับจะล้มเหลวแทนที่จะ
fallback ไปยัง OpenClaw

**OpenAI Codex runtime fallback ไปยังเส้นทาง API-key:** รวบรวม excerpt ของ
Gateway ที่ redact แล้วซึ่งแสดง model, runtime, provider ที่เลือก และความล้มเหลว
ขอให้ผู้ร่วมงานที่ได้รับผลกระทบรันคำสั่ง read-only นี้บนโฮสต์ OpenClaw ของตน:

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
แทนความล้มเหลว OpenAI API-key แบบธรรมดา

**config model refs ของ Codex legacy ยังคงอยู่:** รัน `openclaw doctor --fix`
Doctor จะเขียน legacy model refs ใหม่เป็น `openai/*`, ลบ session และ
whole-agent runtime pins ที่ค้างอยู่ และคง auth-profile overrides ที่มีอยู่ไว้

**app-server ถูกปฏิเสธ:** ใช้ Codex app-server `0.125.0` หรือใหม่กว่า
prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix build เช่น
`0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ OpenClaw ทดสอบ
protocol floor เสถียร `0.125.0`

**`/codex status` เชื่อมต่อไม่ได้:** ตรวจสอบว่า Plugin `codex` ที่ bundled
เปิดใช้งานอยู่, ว่า `plugins.allow` รวมไว้เมื่อมีการตั้งค่า allowlist และ
ว่า `appServer.command`, `url`, `authToken` หรือ headers แบบกำหนดเองถูกต้อง

**การค้นพบ model ช้า:** ลด
`plugins.entries.codex.config.discovery.timeoutMs` หรือปิดการค้นพบ ดู
[Codex harness reference](/th/plugins/codex-harness-reference#model-discovery)

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`,
headers และว่า app-server ระยะไกลพูด Codex app-server
protocol version เดียวกัน

**เครื่องมือ shell หรือ patch เนทีฟถูกบล็อกด้วย `Native hook relay unavailable`:**
thread Codex ยังคงพยายามใช้ native hook relay id ที่ OpenClaw ไม่มี
ลงทะเบียนไว้อีกต่อไป นี่เป็นปัญหา native Codex hook transport ไม่ใช่ความล้มเหลวของ ACP
backend, provider, GitHub หรือ shell-command เริ่มเซสชันใหม่ใน
แชตที่ได้รับผลกระทบด้วย `/new` หรือ `/reset` แล้วลองคำสั่งที่ไม่ก่อผลเสียอีกครั้ง หากทำงาน
ได้หนึ่งครั้งแต่การเรียกเครื่องมือเนทีฟครั้งถัดไปล้มเหลวอีก ให้ถือว่า `/new` เป็นเพียง workaround
ชั่วคราว: คัดลอก prompt ไปยังเซสชันใหม่หลังจากรีสตาร์ท Codex
app-server หรือ OpenClaw Gateway เพื่อให้ thread เก่าถูกทิ้งและการลงทะเบียน native hook
ถูกสร้างใหม่

**model ที่ไม่ใช่ Codex ใช้ harness ในตัว:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่นโยบาย
runtime ของ provider หรือ model จะ route ไปยัง harness อื่น provider refs ธรรมดาที่ไม่ใช่ OpenAI
จะอยู่บนเส้นทาง provider ปกติของตนในโหมด `auto`

**ติดตั้งการใช้คอมพิวเตอร์แล้ว แต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงานว่า
`Native hook relay unavailable` ให้ใช้การกู้คืนรีเลย์ฮุคเนทีฟด้านบน ดู
[การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use#troubleshooting)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงฮาร์เนส Codex](/th/plugins/codex-harness-reference)
- [รันไทม์ฮาร์เนส Codex](/th/plugins/codex-harness-runtime)
- [Plugin เนทีฟของ Codex](/th/plugins/codex-native-plugins)
- [การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use)
- [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [ความช่วยเหลือ OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin ฮาร์เนสเอเจนต์](/th/plugins/sdk-agent-harness)
- [ฮุคของ Plugin](/th/plugins/hooks)
- [ส่งออกการวินิจฉัย](/th/gateway/diagnostics)
- [สถานะ](/th/cli/status)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
