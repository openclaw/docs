---
read_when:
    - คุณต้องการใช้ฮาร์เนสเซิร์ฟเวอร์แอป Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่า Codex harness
    - คุณต้องการให้การปรับใช้ที่ใช้เฉพาะ Codex ล้มเหลวแทนที่จะถอยกลับไปใช้ OpenClaw
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่าน harness ของ app-server ของ Codex ที่มาพร้อมกัน
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-06-27T17:53:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่บันเดิลมาช่วยให้ OpenClaw รันรอบ agent OpenAI แบบฝัง
ผ่าน Codex app-server แทนฮาร์เนส OpenClaw ในตัว

ใช้ฮาร์เนส Codex เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชัน agent ระดับล่าง:
การดำเนินเธรดต่อแบบเนทีฟ, การดำเนินเครื่องมือต่อแบบเนทีฟ, Compaction แบบเนทีฟ และ
การดำเนินงานของ app-server OpenClaw ยังเป็นเจ้าของช่องแชต, ไฟล์เซสชัน, การเลือกโมเดล,
เครื่องมือไดนามิกของ OpenClaw, การอนุมัติ, การส่งสื่อ และมิเรอร์ทรานสคริปต์ที่มองเห็นได้

การตั้งค่าปกติใช้ refs โมเดล OpenAI แบบมาตรฐาน เช่น `openai/gpt-5.5`
อย่ากำหนดค่า refs GPT ของ Codex แบบเก่า ใส่ลำดับ auth ของ OpenAI agent
ไว้ใต้ `auth.order.openai`; id โปรไฟล์ auth ของ Codex แบบเก่าที่เก่ากว่าและ
รายการลำดับ auth ของ Codex แบบเก่าเป็นสถานะเก่าที่ซ่อมแซมโดย
`openclaw doctor --fix`

เมื่อไม่มี sandbox ของ OpenClaw ที่ทำงานอยู่ OpenClaw จะเริ่มเธรด Codex app-server
โดยเปิดใช้โหมดโค้ดเนทีฟของ Codex พร้อมกับปล่อยให้ code-mode-only ปิดไว้ตามค่าเริ่มต้น
ซึ่งทำให้พื้นที่ทำงานเนทีฟและความสามารถด้านโค้ดของ Codex ยังพร้อมใช้งาน ขณะที่
เครื่องมือไดนามิกของ OpenClaw ยังคงดำเนินต่อผ่านบริดจ์ `item/tool/call` ของ app-server
การ sandbox ของ OpenClaw ที่ทำงานอยู่และนโยบายเครื่องมือแบบจำกัดจะปิดโหมดโค้ดเนทีฟ
ทั้งหมด เว้นแต่คุณเลือกใช้เส้นทาง sandbox exec-server แบบทดลอง

ฟีเจอร์เนทีฟ Codex นี้แยกจาก
[โหมดโค้ด OpenClaw](/th/reference/code-mode) ซึ่งเป็นรันไทม์ QuickJS-WASI
แบบเลือกใช้สำหรับการรัน OpenClaw ทั่วไปที่มีรูปแบบอินพุต `exec` ต่างออกไป

สำหรับการแบ่งโมเดล/ผู้ให้บริการ/รันไทม์ในภาพรวม ให้เริ่มที่
[รันไทม์ Agent](/th/concepts/agent-runtimes) เวอร์ชันสั้นคือ:
`openai/gpt-5.5` คือ ref โมเดล, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` ที่บันเดิลมาพร้อมใช้งาน
- หาก config ของคุณใช้ `plugins.allow` ให้รวม `codex`
- Codex app-server `0.125.0` หรือใหม่กว่า Plugin ที่บันเดิลมาจะจัดการไบนารี
  Codex app-server ที่เข้ากันได้ตามค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH` จะไม่
  ส่งผลต่อการเริ่มต้นฮาร์เนสตามปกติ
- Codex auth ที่พร้อมใช้งานผ่าน `openclaw models auth login --provider openai`,
  บัญชี app-server ใน Codex home ของ agent หรือโปรไฟล์ auth แบบ Codex API-key
  ที่ระบุชัดเจน

สำหรับลำดับความสำคัญของ auth, การแยกสภาพแวดล้อม, คำสั่ง app-server แบบกำหนดเอง, การค้นหาโมเดล
และฟิลด์ config ทั้งหมด ดู
[ข้อมูลอ้างอิงฮาร์เนส Codex](/th/plugins/codex-harness-reference)

## เริ่มต้นอย่างรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ Codex ใน OpenClaw ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครสมาชิก ChatGPT/Codex, เปิดใช้ Plugin `codex` ที่บันเดิลมา และใช้
ref โมเดล `openai/gpt-*` แบบมาตรฐาน

ลงชื่อเข้าใช้ด้วย Codex OAuth:

```bash
openclaw models auth login --provider openai
```

เปิดใช้ Plugin `codex` ที่บันเดิลมาและเลือกโมเดล OpenAI agent:

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

รีสตาร์ท Gateway หลังจากเปลี่ยน config ของ Plugin หากแชตที่มีอยู่มีเซสชันอยู่แล้ว
ให้ใช้ `/new` หรือ `/reset` ก่อนทดสอบการเปลี่ยนแปลงรันไทม์ เพื่อให้รอบถัดไป
แก้ฮาร์เนสจาก config ปัจจุบัน

## การกำหนดค่า

config เริ่มต้นอย่างรวดเร็วคือ config ฮาร์เนส Codex ขั้นต่ำที่ใช้งานได้ ตั้งค่าตัวเลือกฮาร์เนส Codex
ใน config ของ OpenClaw และใช้ CLI สำหรับ Codex auth เท่านั้น:

| ความต้องการ                                   | ตั้งค่า                                                                              | ที่ไหน                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| เปิดใช้ฮาร์เนส                     | `plugins.entries.codex.enabled: true`                                            | config OpenClaw                    |
| คงการติดตั้ง Plugin ที่อยู่ในรายการอนุญาต     | รวม `codex` ใน `plugins.allow`                                               | config OpenClaw                    |
| ส่งรอบ OpenAI agent ผ่าน Codex | `agents.defaults.model` หรือ `agents.list[].model` เป็น `openai/gpt-*`               | config agent ของ OpenClaw              |
| ลงชื่อเข้าใช้ด้วย ChatGPT/Codex OAuth       | `openclaw models auth login --provider openai`                                   | โปรไฟล์ auth ของ CLI                   |
| เพิ่ม API-key สำรองสำหรับการรัน Codex      | โปรไฟล์ API-key `openai:*` ที่ระบุหลัง auth แบบสมัครสมาชิกใน `auth.order.openai` | โปรไฟล์ auth ของ CLI + config OpenClaw |
| ปิดแบบ fail closed เมื่อ Codex ไม่พร้อมใช้งาน  | `agentRuntime.id: "codex"` ของผู้ให้บริการหรือโมเดล                                     | config โมเดล/ผู้ให้บริการของ OpenClaw     |
| ใช้ทราฟฟิก OpenAI API โดยตรง          | `agentRuntime.id: "openclaw"` ของผู้ให้บริการหรือโมเดล พร้อม OpenAI auth ปกติ          | config โมเดล/ผู้ให้บริการของ OpenClaw     |
| ปรับพฤติกรรม app-server               | `plugins.entries.codex.config.appServer.*`                                       | config Plugin Codex                |
| เปิดใช้แอป Plugin เนทีฟของ Codex        | `plugins.entries.codex.config.codexPlugins.*`                                    | config Plugin Codex                |
| เปิดใช้ Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | config Plugin Codex                |

ใช้ refs โมเดล `openai/gpt-*` สำหรับรอบ OpenAI agent ที่รองรับด้วย Codex แนะนำให้ใช้
`auth.order.openai` สำหรับลำดับแบบสมัครสมาชิกก่อน/API-key สำรอง โปรไฟล์ auth ของ Codex แบบเก่า
ที่มีอยู่และลำดับ auth ของ Codex แบบเก่าเป็นสถานะเก่าเฉพาะ doctor เท่านั้น;
อย่าเขียน refs GPT ของ Codex แบบเก่าใหม่

อย่าตั้งค่า `compaction.model` หรือ `compaction.provider` บน agent ที่รองรับด้วย Codex
Codex ทำ compaction ผ่านสถานะเธรด app-server แบบเนทีฟของตัวเอง ดังนั้น OpenClaw จะละเว้น
การ override summarizer ในเครื่องเหล่านั้นในขณะรันไทม์ และ `openclaw doctor --fix` จะลบ
ออกเมื่อ agent ใช้ Codex

Lossless ยังคงรองรับในฐานะเอนจินบริบทสำหรับการประกอบ, การนำเข้า และ
การบำรุงรักษารอบ Codex กำหนดค่าผ่าน
`plugins.slots.contextEngine: "lossless-claw"` และ
`plugins.entries.lossless-claw.config.summaryModel` ไม่ใช่ผ่าน
`agents.defaults.compaction.provider` `openclaw doctor --fix` จะ migrate รูปแบบเก่า
`compaction.provider: "lossless-claw"` ไปยังสล็อตเอนจินบริบท Lossless
เมื่อ Codex เป็นรันไทม์ที่ทำงานอยู่ แต่ Codex แบบเนทีฟยังคงเป็นเจ้าของ compaction

ฮาร์เนส Codex app-server แบบเนทีฟรองรับเอนจินบริบทที่ต้องใช้
การประกอบ pre-prompt แบ็กเอนด์ CLI ทั่วไป รวมถึง `codex-cli` ไม่มี
ความสามารถของโฮสต์นั้น

สำหรับ agent ที่รองรับด้วย Codex, `/compact` จะเริ่ม compaction ของ Codex app-server แบบเนทีฟบน
เธรดที่ผูกไว้ OpenClaw จะไม่รอให้เสร็จสิ้น, กำหนด timeout ของ OpenClaw,
รีสตาร์ท app-server ที่ใช้ร่วมกัน หรือ fallback ไปยังเอนจินบริบทหรือ
summarizer OpenAI สาธารณะ หากการผูกเธรด Codex แบบเนทีฟขาดหายหรือ
เก่า คำสั่งจะล้มเหลวแบบ fail closed เพื่อให้ operator เห็นขอบเขตรันไทม์จริง
แทนการสลับแบ็กเอนด์ compaction แบบเงียบ ๆ

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ในรูปแบบนั้น โปรไฟล์ทั้งสองยังคงรันผ่าน Codex สำหรับรอบ agent `openai/gpt-*`
API key เป็นเพียง auth fallback ไม่ใช่คำขอให้สลับไปใช้ OpenClaw หรือ
OpenAI Responses แบบธรรมดา

ส่วนที่เหลือของหน้านี้ครอบคลุมตัวแปรทั่วไปที่ผู้ใช้ต้องเลือก:
รูปแบบการปรับใช้, การกำหนดเส้นทางแบบ fail-closed, นโยบายการอนุมัติ guardian, Plugin
เนทีฟของ Codex และ Computer Use สำหรับรายการตัวเลือกทั้งหมด, ค่าเริ่มต้น, enums, การค้นหา,
การแยกสภาพแวดล้อม, timeouts และฟิลด์ transport ของ app-server ดู
[ข้อมูลอ้างอิงฮาร์เนส Codex](/th/plugins/codex-harness-reference)

## ตรวจสอบรันไทม์ Codex

ใช้ `/status` ในแชตที่คุณคาดว่าจะใช้ Codex รอบ OpenAI agent
ที่รองรับด้วย Codex จะแสดง:

```text
Runtime: OpenAI Codex
```

จากนั้นตรวจสอบสถานะ Codex app-server:

```text
/codex status
/codex models
```

`/codex status` รายงานการเชื่อมต่อ app-server, บัญชี, rate limits, MCP
servers และ Skills `/codex models` แสดง catalog ของ Codex app-server แบบสดสำหรับ
ฮาร์เนสและบัญชี หาก `/status` น่าประหลาดใจ ดู
[การแก้ไขปัญหา](#troubleshooting)

## การกำหนดเส้นทางและการเลือกโมเดล

แยก refs ผู้ให้บริการและนโยบายรันไทม์ออกจากกัน:

- ใช้ `openai/gpt-*` สำหรับรอบ OpenAI agent ผ่าน Codex
- อย่าใช้ refs GPT ของ Codex แบบเก่าใน config รัน `openclaw doctor --fix` เพื่อ
  ซ่อมแซม refs แบบเก่าและ route pins ของเซสชันที่เก่า
- `agentRuntime.id: "codex"` เป็นทางเลือกสำหรับโหมด OpenAI auto ปกติ แต่มีประโยชน์
  เมื่อการปรับใช้ควรล้มเหลวแบบ fail closed หาก Codex ไม่พร้อมใช้งาน
- `agentRuntime.id: "openclaw"` เลือกให้ผู้ให้บริการหรือโมเดลใช้รันไทม์ฝังตัวของ OpenClaw
  เมื่อเป็นความตั้งใจ
- `/codex ...` ควบคุมการสนทนา Codex app-server แบบเนทีฟจากแชต
- ACP/acpx เป็นเส้นทางฮาร์เนสภายนอกอีกแบบหนึ่ง ใช้เฉพาะเมื่อผู้ใช้ขอ
  ACP/acpx หรือ adapter ฮาร์เนสภายนอก

การกำหนดเส้นทางคำสั่งที่พบบ่อย:

| ความตั้งใจของผู้ใช้                                           | ใช้                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| แนบแชตปัจจุบัน                               | `/codex bind [--cwd <path>]`                                                                          |
| ดำเนินเธรด Codex ที่มีอยู่ต่อ                       | `/codex resume <thread-id>`                                                                           |
| แสดงรายการหรือกรองเธรด Codex                          | `/codex threads [filter]`                                                                             |
| แสดงรายการ Plugin เนทีฟของ Codex                             | `/codex plugins list`                                                                                 |
| เปิดใช้หรือปิดใช้ Plugin เนทีฟของ Codex ที่กำหนดค่าไว้    | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| แนบเซสชัน Codex CLI ที่มีอยู่บนโหนดที่จับคู่ไว้ | `/codex sessions --host <node> [filter]`, จากนั้น `/codex resume <session-id> --host <node> --bind here` |
| ส่ง feedback ของ Codex เท่านั้น                              | `/codex diagnostics [note]`                                                                           |
| เริ่มงาน ACP/acpx                                | คำสั่งเซสชัน ACP/acpx ไม่ใช่ `/codex`                                                               |

| กรณีการใช้งาน                                             | กำหนดค่า                                                              | ตรวจสอบ                                  | หมายเหตุ                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| การสมัครใช้งาน ChatGPT/Codex พร้อมรันไทม์ Codex แบบเนทีฟ | `openai/gpt-*` พร้อมเปิดใช้ Plugin `codex`                             | `/status` แสดง `Runtime: OpenAI Codex` | เส้นทางที่แนะนำ                      |
| ปิดแบบ fail closed หาก Codex ไม่พร้อมใช้งาน                  | Provider หรือโมเดล `agentRuntime.id: "codex"`                           | เทิร์นล้มเหลวแทนการใช้ fallback แบบฝัง | ใช้สำหรับการปรับใช้ที่ใช้เฉพาะ Codex        |
| ส่งทราฟฟิกคีย์ API ของ OpenAI โดยตรงผ่าน OpenClaw       | Provider หรือโมเดล `agentRuntime.id: "openclaw"` และ auth OpenAI ปกติ | `/status` แสดงรันไทม์ OpenClaw        | ใช้เฉพาะเมื่อตั้งใจใช้ OpenClaw |
| คอนฟิกเดิม                                        | refs GPT ของ Codex เดิม                                                  | `openclaw doctor --fix` เขียนใหม่ให้     | อย่าเขียนคอนฟิกใหม่ด้วยวิธีนี้      |
| อะแดปเตอร์ Codex สำหรับ ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                               | สถานะงาน/เซสชัน ACP                 | แยกจาก harness Codex แบบเนทีฟ    |

`agents.defaults.imageModel` ใช้การแยก prefix แบบเดียวกัน ใช้ `openai/gpt-*`
สำหรับเส้นทาง OpenAI ปกติ และใช้ `codex/gpt-*` เฉพาะเมื่อการทำความเข้าใจรูปภาพ
ควรรันผ่านเทิร์นของ app-server Codex ที่มีขอบเขตจำกัด อย่าใช้
refs GPT ของ Codex เดิม; doctor จะเขียน prefix เดิมนั้นใหม่เป็น `openai/gpt-*`

## รูปแบบการปรับใช้

### การปรับใช้ Codex พื้นฐาน

ใช้คอนฟิก quickstart เมื่อเทิร์นเอเจนต์ OpenAI ทั้งหมดควรใช้ Codex เป็นค่าเริ่มต้น

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

รูปแบบนี้คง Claude เป็นเอเจนต์ค่าเริ่มต้นและเพิ่มเอเจนต์ Codex ที่มีชื่อ:

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

ด้วยคอนฟิกนี้ เอเจนต์ `main` ใช้เส้นทาง provider ปกติของตัวเอง และเอเจนต์
`codex` ใช้ app-server ของ Codex

### การปรับใช้ Codex แบบ fail-closed

สำหรับเทิร์นเอเจนต์ OpenAI นั้น `openai/gpt-*` จะ resolve ไปยัง Codex อยู่แล้วเมื่อ
Plugin ที่ bundled พร้อมใช้งาน เพิ่มนโยบายรันไทม์แบบชัดเจนเมื่อต้องการกฎ
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
app-server เก่าเกินไป, หรือ app-server เริ่มทำงานไม่ได้

## นโยบาย app-server

โดยค่าเริ่มต้น Plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการไว้ภายในเครื่องด้วย
ทรานสปอร์ต stdio ตั้งค่า `appServer.command` เฉพาะเมื่อตั้งใจรันไฟล์ปฏิบัติการ
อื่น ใช้ทรานสปอร์ต WebSocket เฉพาะเมื่อมี app-server รันอยู่ที่อื่นแล้ว:

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

เซสชัน app-server stdio ภายในเครื่องมีค่าเริ่มต้นเป็นท่าทีของผู้ปฏิบัติการภายในเครื่องที่เชื่อถือได้:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, และ
`sandbox: "danger-full-access"` หากข้อกำหนด Codex ภายในเครื่องไม่อนุญาตท่าที YOLO
โดยนัยนั้น OpenClaw จะเลือกสิทธิ์ guardian ที่อนุญาตแทน
เมื่อ sandbox ของ OpenClaw เปิดใช้งานสำหรับเซสชัน OpenClaw จะปิด Code Mode แบบเนทีฟของ Codex,
เซิร์ฟเวอร์ MCP ของผู้ใช้, และการเรียกใช้ Plugin ที่ backed โดยแอปสำหรับเทิร์นนั้น
แทนการพึ่งพา sandboxing ฝั่งโฮสต์ของ Codex การเข้าถึงเชลล์จะถูกเปิดเผย
ผ่านเครื่องมือไดนามิกที่ backed โดย sandbox ของ OpenClaw เช่น `sandbox_exec` และ
`sandbox_process` เมื่อเครื่องมือ exec/process ปกติพร้อมใช้งาน

ใช้โหมด exec ของ OpenClaw ที่ปรับให้เป็นมาตรฐานเมื่อคุณต้องการ auto-review แบบเนทีฟของ Codex ก่อน
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

สำหรับเซสชัน app-server Codex นั้น OpenClaw จะแมป `tools.exec.mode: "auto"` ไปยังการอนุมัติ
ที่ตรวจทานโดย Codex Guardian โดยปกติคือ
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, และ
`sandbox: "workspace-write"` เมื่อข้อกำหนดภายในเครื่องอนุญาตค่าเหล่านั้น
ใน `tools.exec.mode: "auto"` OpenClaw จะไม่คง overrides Codex เดิมที่ไม่ปลอดภัยอย่าง
`approvalPolicy: "never"` หรือ `sandbox: "danger-full-access"` ไว้; ใช้
`tools.exec.mode: "full"` สำหรับท่าที Codex แบบไม่มีการอนุมัติที่ตั้งใจไว้
preset เดิม `plugins.entries.codex.config.appServer.mode: "guardian"` ยัง
ทำงานได้ แต่ `tools.exec.mode: "auto"` คือ surface ของ OpenClaw ที่ปรับให้เป็นมาตรฐานแล้ว

สำหรับการเปรียบเทียบระดับโหมดกับการอนุมัติ host exec และสิทธิ์ ACPX
ดู [โหมดสิทธิ์](/th/tools/permission-modes)

สำหรับทุกฟิลด์ของ app-server, ลำดับ auth, การแยก environment, การค้นพบ, และ
พฤติกรรม timeout ดู [อ้างอิง Codex harness](/th/plugins/codex-harness-reference)

## คำสั่งและการวินิจฉัย

Plugin ที่ bundled จะลงทะเบียน `/codex` เป็นคำสั่ง slash บนช่องทางใดๆ ที่
รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` ตรวจสอบการเชื่อมต่อ app-server, โมเดล, บัญชี, rate limits,
  เซิร์ฟเวอร์ MCP, และ skills
- `/codex models` แสดงรายการโมเดล app-server Codex แบบ live
- `/codex threads [filter]` แสดงรายการเธรด app-server Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับ
  เธรด Codex ที่มีอยู่
- `/codex compact` ขอให้ app-server Codex compact เธรดที่แนบอยู่
- `/codex review` เริ่ม review แบบเนทีฟของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` ขออนุมัติก่อนส่ง feedback ของ Codex สำหรับ
  เธรดที่แนบอยู่
- `/codex account` แสดงสถานะบัญชีและ rate-limit
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของ app-server Codex
- `/codex skills` แสดงรายการ skills ของ app-server Codex

สำหรับรายงานสนับสนุนส่วนใหญ่ ให้เริ่มด้วย `/diagnostics [note]` ในบทสนทนา
ที่เกิดบั๊กขึ้น คำสั่งนี้จะสร้างรายงานการวินิจฉัย Gateway หนึ่งรายการ และสำหรับเซสชัน
Codex harness จะขออนุมัติให้ส่งชุด feedback ของ Codex ที่เกี่ยวข้อง
ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรม
ในแชตกลุ่ม

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลด feedback ของ Codex
สำหรับเธรดที่แนบอยู่ปัจจุบันโดยไม่รวมชุดการวินิจฉัย Gateway เต็มรูปแบบ

### ตรวจสอบเธรด Codex ภายในเครื่อง

วิธีที่เร็วที่สุดในการตรวจสอบรัน Codex ที่มีปัญหามักเป็นการเปิดเธรด Codex
แบบเนทีฟโดยตรง:

```bash
codex resume <thread-id>
```

รับ thread id จากคำตอบ `/diagnostics` ที่เสร็จสมบูรณ์, `/codex binding`, หรือ
`/codex threads [filter]`

สำหรับกลไกการอัปโหลดและขอบเขตการวินิจฉัยระดับรันไทม์ ดู
[รันไทม์ Codex harness](/th/plugins/codex-harness-runtime#codex-feedback-upload)

Auth ถูกเลือกตามลำดับนี้:

1. โปรไฟล์ auth OpenAI ที่เรียงลำดับไว้สำหรับเอเจนต์ โดยควรอยู่ภายใต้
   `auth.order.openai` รัน `openclaw doctor --fix` เพื่อย้ายข้อมูล
   ids โปรไฟล์ auth Codex เดิมและลำดับ auth Codex เดิม
2. บัญชีที่มีอยู่ของ app-server ใน Codex home ของเอเจนต์นั้น
3. สำหรับการเรียกใช้ app-server stdio ภายในเครื่องเท่านั้น `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server และยังต้องใช้ auth OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์ auth Codex แบบการสมัครใช้งาน ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากโปรเซสลูก Codex ที่ spawn ขึ้นมา ซึ่ง
ทำให้คีย์ API ระดับ Gateway ยังพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้เทิร์น app-server Codex แบบเนทีฟถูกคิดค่าบริการผ่าน API โดยไม่ตั้งใจ
โปรไฟล์คีย์ API Codex แบบชัดเจนและ fallback คีย์ env ของ stdio ภายในเครื่องจะใช้การล็อกอิน app-server
แทนการสืบทอด env ของโปรเซสลูก การเชื่อมต่อ app-server แบบ WebSocket
จะไม่ได้รับ fallback คีย์ API จาก env ของ Gateway; ให้ใช้โปรไฟล์ auth แบบชัดเจนหรือบัญชี
ของ app-server ระยะไกลเอง
เมื่อกำหนดค่า Plugin Codex แบบเนทีฟแล้ว OpenClaw จะติดตั้งหรือ refresh
Plugin เหล่านั้นผ่าน app-server ที่เชื่อมต่อก่อนเปิดเผยแอปที่ Plugin เป็นเจ้าของให้
เธรด Codex `app/list` ยังคงเป็นแหล่งความจริงสำหรับ app ids,
accessibility, และ metadata แต่ OpenClaw เป็นเจ้าของการตัดสินใจเปิดใช้งานต่อเธรด:
หากนโยบายอนุญาตแอปที่เข้าถึงได้ซึ่งอยู่ในรายการ OpenClaw จะส่ง
`thread/start.config.apps[appId].enabled = true` แม้ว่า `app/list` จะรายงานในขณะนั้นว่า
แอปนั้นถูกปิดใช้งาน เส้นทางนี้ไม่ได้สร้างการติดตั้งแอปให้ ids ที่ไม่รู้จัก;
OpenClaw เปิดใช้งานเฉพาะ Plugin marketplace ด้วย `plugin/install`
แล้วจึง refresh inventory

หากโปรไฟล์การสมัครใช้งานชนกับขีดจำกัดการใช้งาน Codex OpenClaw จะบันทึกเวลา reset
เมื่อ Codex รายงานไว้ และลองใช้โปรไฟล์ auth ถัดไปตามลำดับสำหรับรัน Codex เดียวกัน
เมื่อเลยเวลา reset แล้ว โปรไฟล์การสมัครใช้งานจะกลับมามีสิทธิ์ใช้งานอีกครั้ง
โดยไม่ต้องเปลี่ยนโมเดล `openai/gpt-*` หรือรันไทม์ Codex ที่เลือกไว้

สำหรับการเรียกใช้ app-server stdio ภายในเครื่อง OpenClaw จะตั้งค่า `CODEX_HOME` เป็นไดเรกทอรี
ต่อเอเจนต์ เพื่อให้คอนฟิก Codex, ไฟล์ auth/account, cache/data ของ Plugin, และสถานะ
เธรดแบบเนทีฟไม่อ่านหรือเขียน `~/.codex` ส่วนตัวของผู้ปฏิบัติการโดยค่าเริ่มต้น
OpenClaw จะคง `HOME` ของโปรเซสปกติไว้; subprocesses ที่ Codex รัน
ยังสามารถค้นหาคอนฟิกและโทเคนใน user-home ได้ และ Codex อาจค้นพบรายการ
`$HOME/.agents/skills` และ `$HOME/.agents/plugins/marketplace.json` ที่ใช้ร่วมกัน

หากการปรับใช้ต้องการการแยก environment เพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นลงใน
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

`appServer.clearEnv` มีผลเฉพาะกับโปรเซสลูก app-server Codex ที่ spawn ขึ้นมาเท่านั้น
OpenClaw จะลบ `CODEX_HOME` และ `HOME` ออกจากรายการนี้ระหว่างการ normalize การเริ่มภายในเครื่อง:
`CODEX_HOME` ยังคงเป็นแบบต่อเอเจนต์ และ `HOME` ยังคงสืบทอดมาเพื่อให้
subprocesses ใช้สถานะ user-home ปกติได้

เครื่องมือแบบไดนามิกของ Codex ใช้การโหลดแบบ `searchable` เป็นค่าเริ่มต้น OpenClaw ไม่เปิดเผย
เครื่องมือแบบไดนามิกที่ซ้ำกับการดำเนินการในเวิร์กสเปซที่เป็นเนทีฟของ Codex ได้แก่ `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` และ `update_plan` เครื่องมือผสานรวม OpenClaw
ส่วนใหญ่ที่เหลือ เช่น การรับส่งข้อความ, สื่อ, Cron, เบราว์เซอร์, โหนด,
Gateway และ `heartbeat_respond` พร้อมใช้งานผ่านการค้นหาเครื่องมือของ Codex ภายใต้
เนมสเปซ `openclaw` ซึ่งช่วยให้บริบทโมเดลเริ่มต้นเล็กลง การค้นหาเว็บ
ใช้เครื่องมือ `web_search` ที่โฮสต์โดย Codex เป็นค่าเริ่มต้นเมื่อเปิดใช้การค้นหาและไม่ได้เลือก
ผู้ให้บริการที่จัดการไว้ การค้นหาที่โฮสต์แบบเนทีฟและเครื่องมือแบบไดนามิก
`web_search` ที่จัดการโดย OpenClaw ใช้ร่วมกันไม่ได้ ดังนั้นการค้นหาที่จัดการไว้จึงไม่สามารถข้าม
ข้อจำกัดโดเมนแบบเนทีฟได้ OpenClaw ใช้เครื่องมือที่จัดการไว้เมื่อการค้นหาที่โฮสต์
ไม่พร้อมใช้งาน ถูกปิดใช้อย่างชัดเจน หรือถูกแทนที่ด้วยผู้ให้บริการที่จัดการไว้ซึ่งเลือกไว้
OpenClaw ปิดใช้งานส่วนขยาย `web.run` แบบสแตนด์อโลนของ Codex ไว้ เพราะ
ทราฟฟิกแอปเซิร์ฟเวอร์สำหรับโปรดักชันปฏิเสธเนมสเปซ `web` ที่ผู้ใช้กำหนดเอง
`tools.web.search.enabled: false` ปิดใช้งานทั้งสองเส้นทาง เช่นเดียวกับการรันแบบ LLM ล้วน
ที่ปิดเครื่องมือไว้ Codex ถือว่า `"cached"` เป็นค่ากำหนด และแก้ค่าเป็นการเข้าถึงภายนอกแบบสด
สำหรับเทิร์นแอปเซิร์ฟเวอร์ที่ไม่ถูกจำกัด การถอยกลับไปใช้แบบจัดการโดยอัตโนมัติ
จะปิดกั้นเมื่อมีการตั้งค่า `allowedDomains` แบบเนทีฟ เพื่อไม่ให้สามารถข้ามรายการอนุญาตได้
การเปลี่ยนแปลงนโยบายการค้นหาที่มีผลถาวรจะหมุนเธรด Codex ที่ผูกไว้
ก่อนเทิร์นถัดไป ข้อจำกัดชั่วคราวรายเทิร์นใช้เธรดจำกัดชั่วคราว
และคงการผูกที่มีอยู่ไว้สำหรับการกลับมาทำงานต่อในภายหลัง
`sessions_yield` และการตอบกลับแหล่งที่มาแบบใช้เฉพาะเครื่องมือข้อความยังคงเป็นแบบตรง เพราะ
สิ่งเหล่านั้นเป็นสัญญาการควบคุมเทิร์น `sessions_spawn` ยังคงค้นหาได้ เพื่อให้
`spawn_agent` แบบเนทีฟของ Codex ยังคงเป็นพื้นผิวซับเอเจนต์หลักของ Codex ในขณะที่
การมอบหมายงานแบบ OpenClaw หรือ ACP อย่างชัดเจนยังคงพร้อมใช้งานผ่านเนมสเปซเครื่องมือแบบไดนามิก
`openclaw` คำแนะนำการทำงานร่วมกันของ Heartbeat บอกให้ Codex ค้นหา
`heartbeat_respond` ก่อนจบเทิร์น Heartbeat เมื่อเครื่องมือนั้นยังไม่ได้โหลด

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับแอปเซิร์ฟเวอร์ Codex แบบกำหนดเอง
ที่ไม่สามารถค้นหาเครื่องมือแบบไดนามิกที่เลื่อนไว้ หรือเมื่อดีบักเพย์โหลดเครื่องมือแบบเต็ม

ฟิลด์ Plugin ของ Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น        | ความหมาย                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | ใช้ `"direct"` เพื่อใส่เครื่องมือแบบไดนามิกของ OpenClaw ลงในบริบทเครื่องมือ Codex เริ่มต้นโดยตรง |
| `codexDynamicToolsExclude` | `[]`           | ชื่อเครื่องมือแบบไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากเทิร์นแอปเซิร์ฟเวอร์ของ Codex              |
| `codexPlugins`             | ปิดใช้งาน       | การรองรับ Plugin/แอป Codex แบบเนทีฟสำหรับ Plugin คัดสรรที่ติดตั้งจากซอร์สและย้ายมาแล้ว           |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` จะเรียก Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | ไบนารี Codex ที่จัดการให้                                   | ไฟล์ปฏิบัติการสำหรับ stdio transport เว้นไว้เพื่อใช้ไบนารีที่จัดการให้; ตั้งค่าเฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับ stdio transport                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | ไม่ได้ตั้งค่า                                                  | URL ของ WebSocket app-server                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | ไม่ได้ตั้งค่า                                                  | Bearer token สำหรับ WebSocket transport รับค่าสตริงตรงๆ หรือ SecretInput เช่น `${CODEX_APP_SERVER_TOKEN}`                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | ส่วนหัว WebSocket เพิ่มเติม ค่าของส่วนหัวรับสตริงตรงๆ หรือค่า SecretInput ได้ เช่น `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะถูกลบออกจากกระบวนการ stdio app-server ที่ถูกเรียก หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว OpenClaw จะคง `CODEX_HOME` แบบต่อเอเจนต์และ `HOME` ที่สืบทอดมาสำหรับการเปิดใช้งานในเครื่อง                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | เลือกใช้พื้นผิวเครื่องมือแบบ code-mode-only ของ Codex เครื่องมือแบบไดนามิกของ OpenClaw ยังคงลงทะเบียนกับ Codex เพื่อให้การเรียก `tools.*` แบบซ้อนส่งกลับผ่านบริดจ์ `item/tool/call` ของ app-server                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | ไม่ได้ตั้งค่า                                                  | ราก workspace ของ Codex app-server ระยะไกล เมื่อตั้งค่าแล้ว OpenClaw จะอนุมานราก workspace ในเครื่องจาก workspace ของ OpenClaw ที่ resolve แล้ว รักษาส่วนท้าย cwd ปัจจุบันไว้ใต้รากระยะไกลนี้ และส่งเฉพาะ cwd สุดท้ายของ app-server ไปยัง Codex หาก cwd อยู่นอกราก workspace ของ OpenClaw ที่ resolve แล้ว OpenClaw จะ fail closed แทนการส่งพาธ gateway-local ไปยัง app-server ระยะไกล |
| `requestTimeoutMs`                            | `60000`                                                | timeout สำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | ช่วงเงียบหลังจาก Codex รับ turn หรือหลังจากคำขอ app-server แบบอยู่ในขอบเขต turn ขณะที่ OpenClaw รอ `turn/completed`                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ตัวเฝ้า completion-idle และความคืบหน้าที่ใช้หลังจากการส่งต่อเครื่องมือ การเสร็จสิ้นของเครื่องมือ native ความคืบหน้า raw assistant หลังเครื่องมือ การเสร็จสิ้น raw reasoning หรือความคืบหน้า reasoning ขณะที่ OpenClaw รอ `turn/completed` ใช้ค่านี้สำหรับ workload ที่เชื่อถือได้หรือหนัก ซึ่งการสังเคราะห์หลังเครื่องมือสามารถเงียบได้นานกว่างบเวลาการปล่อย assistant สุดท้ายอย่างสมเหตุสมผล                                |
| `mode`                                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ในเครื่องไม่อนุญาต YOLO | preset สำหรับการดำเนินการแบบ YOLO หรือที่ guardian ตรวจทาน ข้อกำหนด stdio ในเครื่องที่ละเว้น `danger-full-access`, การอนุมัติ `never` หรือผู้ตรวจทาน `user` จะทำให้ค่าเริ่มต้นโดยนัยเป็น guardian                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` หรือนโยบายการอนุมัติ guardian ที่อนุญาต       | นโยบายการอนุมัติ Codex native ที่ส่งไปยังการเริ่ม/กลับมาทำต่อ/turn ของเธรด ค่าเริ่มต้นของ guardian จะเลือก `"on-request"` เมื่ออนุญาต                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` หรือ sandbox guardian ที่อนุญาต  | โหมด sandbox ของ Codex native ที่ส่งไปยังการเริ่ม/กลับมาทำต่อของเธรด ค่าเริ่มต้นของ guardian จะเลือก `"workspace-write"` เมื่ออนุญาต ไม่เช่นนั้นใช้ `"read-only"` เมื่อ sandbox ของ OpenClaw ทำงานอยู่ turn แบบ `danger-full-access` จะใช้ Codex `workspace-write` พร้อมการเข้าถึงเครือข่ายที่ได้จากการตั้งค่า egress ของ sandbox OpenClaw                                                                                     |
| `approvalsReviewer`                           | `"user"` หรือผู้ตรวจทาน guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทาน prompt การอนุมัติ native เมื่ออนุญาต ไม่เช่นนั้นใช้ `guardian_subagent` หรือ `user` `guardian_subagent` ยังคงเป็น alias แบบ legacy                                                                                                                                                                                                                              |
| `serviceTier`                                 | ไม่ได้ตั้งค่า                                                  | service tier ของ Codex app-server แบบไม่บังคับ `"priority"` เปิดใช้การกำหนดเส้นทาง fast-mode, `"flex"` ขอการประมวลผลแบบ flex, `null` ล้าง override และรองรับ `"fast"` แบบ legacy ในฐานะ `"priority"`                                                                                                                                                                                                 |
| `networkProxy`                                | ปิดใช้งาน                                               | เลือกใช้ networking ของโปรไฟล์สิทธิ์ Codex สำหรับคำสั่ง app-server OpenClaw จะกำหนด config `permissions.<profile>.network` ที่เลือกและเลือกด้วย `default_permissions` แทนการส่ง `sandbox`                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | preview opt-in ที่ลงทะเบียนสภาพแวดล้อม Codex ที่หนุนด้วย sandbox ของ OpenClaw กับ Codex app-server 0.132.0 หรือใหม่กว่า เพื่อให้การดำเนินการ Codex native สามารถทำงานภายใน sandbox ของ OpenClaw ที่ใช้งานอยู่                                                                                                                                                                                                         |

`appServer.networkProxy` เป็นการตั้งค่าแบบชัดเจนเพราะเปลี่ยนสัญญา sandbox ของ Codex
เมื่อเปิดใช้งาน OpenClaw จะตั้งค่า `features.network_proxy.enabled` และ
`default_permissions` ใน config เธรด Codex ด้วย เพื่อให้โปรไฟล์สิทธิ์ที่สร้างขึ้น
สามารถเริ่ม networking ที่ Codex จัดการได้ โดยค่าเริ่มต้น OpenClaw จะสร้างชื่อโปรไฟล์
`openclaw-network-<fingerprint>` ที่ทนต่อการชนกันจากเนื้อหาโปรไฟล์;
ใช้ `profileName` เฉพาะเมื่อต้องการชื่อในเครื่องที่เสถียร

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

หาก runtime ของ app-server ปกติจะเป็น `danger-full-access` การเปิดใช้
`networkProxy` จะใช้การเข้าถึงระบบไฟล์แบบ workspace-style สำหรับ
โปรไฟล์สิทธิ์ที่สร้างขึ้น การบังคับใช้เครือข่ายที่ Codex จัดการคือ networking
แบบ sandboxed ดังนั้นโปรไฟล์ full-access จะไม่ปกป้องทราฟฟิกขาออก
รายการโดเมนใช้ค่า `allow` หรือ `deny`; รายการ Unix socket ใช้ค่า
`allow` หรือ `none` ของ Codex

การเรียกเครื่องมือแบบไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` ใช้ watchdog ของ
OpenClaw ค่าเริ่มต้น 90 วินาที อาร์กิวเมนต์ `timeoutMs` แบบรายคำขอที่เป็นค่าบวกจะขยาย
หรือย่นงบเวลาของเครื่องมือนั้นโดยเฉพาะ เครื่องมือ `image_generate` ใช้
`agents.defaults.imageGenerationModel.timeoutMs` เมื่อการเรียกเครื่องมือไม่ได้
ระบุ timeout ของตัวเอง หรือใช้ค่าเริ่มต้นสำหรับการสร้างภาพ 120 วินาทีแทน
เครื่องมือ `image` สำหรับการทำความเข้าใจสื่อใช้
`tools.media.image.timeoutSeconds` หรือค่าเริ่มต้นสำหรับสื่อ 60 วินาที สำหรับการทำความเข้าใจภาพ
timeout นั้นมีผลกับตัวคำขอเอง และไม่ถูก
ลดลงจากงานเตรียมการก่อนหน้า งบเวลาของเครื่องมือแบบไดนามิกถูก
จำกัดสูงสุดที่ 600000 ms เมื่อ timeout, OpenClaw จะยกเลิกสัญญาณของเครื่องมือ
ในที่ที่รองรับ และส่งคืนการตอบกลับ dynamic-tool ที่ล้มเหลวให้ Codex เพื่อให้ turn
ดำเนินต่อได้ แทนที่จะปล่อยให้ session ค้างอยู่ใน `processing`
watchdog นี้คืองบเวลาชั้นนอกของ `item/tool/call` แบบไดนามิก; timeout ของคำขอเฉพาะ provider
จะทำงานอยู่ภายในการเรียกนั้นและคง semantics ของ timeout ของตัวเองไว้

หลังจาก Codex ยอมรับ turn และหลังจาก OpenClaw ตอบสนองต่อคำขอ app-server
ที่มีขอบเขตตาม turn แล้ว harness คาดว่า Codex จะสร้างความคืบหน้าของ current-turn และ
จบ native turn ด้วย `turn/completed` ในที่สุด หาก app-server เงียบ
เป็นเวลา `appServer.turnCompletionIdleTimeoutMs`, OpenClaw จะพยายามอย่างดีที่สุดเพื่อ
interrupt turn ของ Codex, บันทึก diagnostic timeout, และปล่อย
session lane ของ OpenClaw เพื่อไม่ให้ข้อความแชตถัดไปถูกคิวไว้หลัง native turn
ที่ค้างอยู่ notification แบบ non-terminal ส่วนใหญ่สำหรับ turn เดียวกันจะปลดอาวุธ
watchdog สั้นนี้ เพราะ Codex ได้พิสูจน์แล้วว่า turn ยังมีชีวิตอยู่ การส่งต่อเครื่องมือใช้
งบ idle หลังเครื่องมือที่นานกว่า: หลังจาก OpenClaw ส่งคืนการตอบกลับ `item/tool/call`,
หลังจากรายการ native tool เช่น `commandExecution` เสร็จสิ้น, หลังจากการเสร็จสิ้นของ raw
`custom_tool_call_output`, และหลังจากความคืบหน้าของ raw assistant หลังเครื่องมือ,
การเสร็จสิ้นของ raw reasoning, หรือความคืบหน้าของ reasoning ตัว guard ใช้
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` เมื่อกำหนดค่าไว้ และ
ค่าเริ่มต้นเป็นห้านาทีในกรณีอื่น งบหลังเครื่องมือเดียวกันนี้ยังขยาย
progress watchdog สำหรับช่วง silent synthesis ก่อนที่ Codex จะปล่อย event
current-turn ถัดไป notification ระดับ global ของ app-server เช่นการอัปเดต rate-limit
จะไม่ reset ความคืบหน้าแบบ turn-idle การเสร็จสิ้นของ reasoning, การเสร็จสิ้นของ
commentary `agentMessage`, และความคืบหน้าของ raw reasoning หรือ assistant ก่อนเครื่องมือ สามารถ
ตามด้วยการตอบกลับสุดท้ายอัตโนมัติได้ จึงใช้ post-progress reply
guard แทนการปล่อย session lane ทันที เฉพาะรายการ `agentMessage`
ที่ completed แบบ final/non-commentary และการเสร็จสิ้นของ raw
assistant ก่อนเครื่องมือเท่านั้นที่จะ arm การปล่อย assistant-output: หาก Codex เงียบต่อไป
โดยไม่มี `turn/completed`, OpenClaw จะพยายามอย่างดีที่สุดเพื่อ interrupt native turn และ
ปล่อย session lane ความล้มเหลวของ stdio app-server ที่ replay-safe รวมถึง
timeout ของ turn-completion idle ที่ไม่มีหลักฐาน assistant, tool, active-item, หรือ
side-effect จะถูกลองใหม่หนึ่งครั้งบน app-server attempt ใหม่ timeout ที่ไม่ปลอดภัย
ยังคง retire client app-server ที่ค้างและปล่อย session lane ของ OpenClaw
และยังล้าง native thread binding ที่ค้างแทนที่จะ replay โดยอัตโนมัติ
timeout ของ completion-watch จะแสดงข้อความ timeout เฉพาะ Codex: กรณี replay-safe
จะบอกว่าการตอบกลับอาจไม่สมบูรณ์ ส่วนกรณีที่ไม่ปลอดภัย
จะบอกให้ผู้ใช้ตรวจสอบสถานะปัจจุบันก่อนลองใหม่ diagnostic timeout สาธารณะ
มีฟิลด์เชิงโครงสร้าง เช่น method ของ notification app-server ล่าสุด,
id/type/role ของ raw assistant response item, จำนวน active request/item, และสถานะ watch
ที่ armed เมื่อ notification ล่าสุดเป็น raw assistant response item จะ
รวมตัวอย่าง preview ข้อความ assistant แบบจำกัดไว้ด้วย โดยไม่รวม raw prompt หรือ
เนื้อหาเครื่องมือ

environment override ยังพร้อมใช้งานสำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้าม binary ที่จัดการไว้เมื่อ
ไม่ได้ตั้งค่า `appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกนำออกแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว ควรใช้ config
สำหรับ deployment ที่ทำซ้ำได้ เพราะทำให้พฤติกรรมของ Plugin อยู่ใน
ไฟล์ที่ผ่านการ review เดียวกันกับส่วนที่เหลือของการตั้งค่า Codex harness

## Native Codex plugins

การรองรับ native Codex Plugin ใช้ความสามารถ app และ Plugin ของ Codex app-server เอง
ใน thread ของ Codex เดียวกับ turn ของ OpenClaw harness OpenClaw
ไม่แปล Codex plugins ให้เป็นเครื่องมือไดนามิกของ OpenClaw แบบสังเคราะห์ `codex_plugin_*`

`codexPlugins` มีผลเฉพาะกับ session ที่เลือก native Codex harness เท่านั้น
ไม่มีผลกับการรัน built-in harness, การรัน provider OpenAI ปกติ, ACP conversation
bindings, หรือ harness อื่น

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

thread app config จะถูกคำนวณเมื่อ OpenClaw สร้าง session ของ Codex harness
หรือแทนที่ Codex thread binding ที่ค้างอยู่ ไม่ได้คำนวณใหม่ในทุก turn
หลังจากเปลี่ยน `codexPlugins` ให้ใช้ `/new`, `/reset`, หรือ restart gateway เพื่อให้
session ของ Codex harness ในอนาคตเริ่มด้วยชุด app ที่อัปเดตแล้ว

สำหรับเงื่อนไขการ migrate, app inventory, นโยบาย destructive action,
elicitations, และ diagnostic ของ native Plugin โปรดดู
[Native Codex plugins](/th/plugins/codex-native-plugins)

การเข้าถึง app และ Plugin ฝั่ง OpenAI ถูกควบคุมโดยบัญชี Codex
ที่ลงชื่อเข้าใช้ และสำหรับ workspace แบบ Business และ Enterprise/Edu จะถูกควบคุมโดย workspace app controls ดู
[Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
สำหรับภาพรวม account และ workspace-control ของ OpenAI

## Computer Use

Computer Use ครอบคลุมอยู่ในคู่มือการตั้งค่าของตัวเอง:
[Codex Computer Use](/th/plugins/codex-computer-use)

สรุปสั้นๆ: OpenClaw ไม่ vendor app ควบคุม desktop หรือดำเนินการ
desktop actions เอง แต่จะเตรียม Codex app-server, ตรวจสอบว่า
MCP server `computer-use` พร้อมใช้งาน, แล้วให้ Codex เป็นเจ้าของการเรียก native MCP
tool ระหว่าง turn ในโหมด Codex

## ขอบเขตรันไทม์

Codex harness เปลี่ยนเฉพาะ embedded agent executor ระดับต่ำเท่านั้น

- รองรับเครื่องมือไดนามิกของ OpenClaw Codex ขอให้ OpenClaw execute
  เครื่องมือเหล่านั้น ดังนั้น OpenClaw ยังคงอยู่ใน execution path
- เครื่องมือ shell, patch, MCP และ native app แบบ Codex-native เป็นของ Codex
  OpenClaw สามารถสังเกตหรือบล็อก native event ที่เลือกผ่าน relay
  ที่รองรับได้ แต่จะไม่เขียนอาร์กิวเมนต์ของ native tool ใหม่
- Codex เป็นเจ้าของ native compaction OpenClaw เก็บ transcript mirror สำหรับประวัติ
  channel, search, `/new`, `/reset`, และการสลับ model หรือ harness ในอนาคต แต่
  ไม่แทนที่ Codex compaction ด้วยตัวสรุปของ OpenClaw หรือ context-engine
- การสร้างสื่อ, การทำความเข้าใจสื่อ, TTS, approvals, และ output ของ messaging-tool
  ยังคงผ่านการตั้งค่า provider/model ของ OpenClaw ที่ตรงกัน
- `tool_result_persist` ใช้กับ transcript tool results ที่ OpenClaw เป็นเจ้าของ ไม่ใช่
  records ของ Codex-native tool result

สำหรับ hook layers, surface V1 ที่รองรับ, การจัดการ native permission, queue
steering, กลไกอัปโหลด feedback ของ Codex, และรายละเอียด compaction โปรดดู
[Codex harness runtime](/th/plugins/codex-harness-runtime)

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็น provider `/model` ปกติ:** นั่นเป็นพฤติกรรมที่คาดไว้สำหรับ
config ใหม่ เลือก model `openai/gpt-*`, เปิดใช้งาน
`plugins.entries.codex.enabled`, และตรวจสอบว่า `plugins.allow` ไม่ได้ exclude
`codex`

**OpenClaw ใช้ built-in harness แทน Codex:** ตรวจสอบให้แน่ใจว่า model ref เป็น
`openai/gpt-*` บน provider OpenAI อย่างเป็นทางการ และ Codex Plugin ถูก
ติดตั้งและเปิดใช้งานแล้ว หากต้องการหลักฐานที่เข้มงวดระหว่างทดสอบ ให้ตั้ง provider หรือ
model `agentRuntime.id: "codex"` runtime ของ Codex ที่ถูกบังคับจะล้มเหลวแทนที่จะ
fallback ไปยัง OpenClaw

**OpenAI Codex runtime fallback ไปยังเส้นทาง API-key:** รวบรวม excerpt ของ
gateway ที่ redact แล้วซึ่งแสดง model, runtime, provider ที่เลือก, และ failure
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
`candidateProvider: "openai"`, และผลลัพธ์ `401`, `Incorrect API key`, หรือ
`No API key` การรันที่แก้ไขแล้วควรแสดงเส้นทาง OpenAI OAuth
แทนความล้มเหลวของ OpenAI API-key แบบ plain

**config ของ legacy Codex model refs ยังคงอยู่:** รัน `openclaw doctor --fix`
Doctor จะเขียน legacy model refs ใหม่เป็น `openai/*`, ลบ session ที่ค้างและ
runtime pins ทั้ง agent ที่เก่าออก, และคง auth-profile overrides ที่มีอยู่ไว้

**app-server ถูกปฏิเสธ:** ใช้ Codex app-server `0.125.0` หรือใหม่กว่า
prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix ของ build เช่น
`0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ OpenClaw ทดสอบ
stable protocol floor `0.125.0`

**`/codex status` เชื่อมต่อไม่ได้:** ตรวจสอบว่า bundled `codex` Plugin
เปิดใช้งานแล้ว, `plugins.allow` รวม Plugin นี้เมื่อมีการกำหนด allowlist, และ
`appServer.command`, `url`, `authToken`, หรือ headers แบบกำหนดเองใดๆ ถูกต้อง

**การค้นหา model ช้า:** ลด
`plugins.entries.codex.config.discovery.timeoutMs` หรือปิด discovery ดู
[Codex harness reference](/th/plugins/codex-harness-reference#model-discovery)

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`,
headers, และ remote app-server ใช้ protocol version ของ Codex app-server
เดียวกัน

**เครื่องมือ native shell หรือ patch ถูกบล็อกด้วย `Native hook relay unavailable`:**
thread ของ Codex ยังพยายามใช้ native hook relay id ที่ OpenClaw
ไม่ได้ register ไว้อีกต่อไป นี่เป็นปัญหา native Codex hook transport ไม่ใช่ความล้มเหลวของ ACP
backend, provider, GitHub, หรือ shell-command เริ่ม session ใหม่ใน
แชตที่ได้รับผลกระทบด้วย `/new` หรือ `/reset` แล้วลองคำสั่งที่ไม่เป็นอันตรายอีกครั้ง หาก
ใช้งานได้ครั้งหนึ่ง แต่ native tool call ถัดไปล้มเหลวอีก ให้ถือว่า `/new` เป็นเพียง
workaround ชั่วคราว: คัดลอก prompt ไปยัง session ใหม่หลังจาก restart Codex
app-server หรือ OpenClaw Gateway เพื่อให้ thread เก่าถูกทิ้งและ native hook
registrations ถูกสร้างขึ้นใหม่

**model ที่ไม่ใช่ Codex ใช้ built-in harness:** นั่นเป็นพฤติกรรมที่คาดไว้ เว้นแต่
นโยบาย runtime ของ provider หรือ model จะ route ไปยัง harness อื่น provider refs ที่ไม่ใช่ OpenAI
แบบ plain จะคงอยู่บนเส้นทาง provider ปกติในโหมด `auto`

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงานว่า
`Native hook relay unavailable` ให้ใช้การกู้คืน native hook relay ด้านบน ดู
[Codex Computer Use](/th/plugins/codex-computer-use#troubleshooting)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference)
- [รันไทม์ Codex harness](/th/plugins/codex-harness-runtime)
- [Plugin Codex แบบเนทีฟ](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [รันไทม์ของ Agent](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [ความช่วยเหลือ OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness ของ Agent](/th/plugins/sdk-agent-harness)
- [hook ของ Plugin](/th/plugins/hooks)
- [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics)
- [สถานะ](/th/cli/status)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
