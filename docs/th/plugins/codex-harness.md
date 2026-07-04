---
read_when:
    - คุณต้องการใช้ฮาร์เนส app-server ของ Codex ที่รวมมาให้
    - คุณต้องมีตัวอย่างการกำหนดค่าฮาร์เนส Codex
    - คุณต้องการให้การปรับใช้เฉพาะ Codex ล้มเหลวแทนที่จะถอยกลับไปใช้ OpenClaw
summary: เรียกใช้รอบการทำงานของเอเจนต์แบบฝังตัวของ OpenClaw ผ่านฮาร์เนส app-server ของ Codex ที่มาพร้อมกัน
title: ฮาร์เนส Codex
x-i18n:
    generated_at: "2026-07-04T15:42:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` ที่รวมมาในตัวช่วยให้ OpenClaw รันรอบเอเจนต์ OpenAI แบบฝังตัว
ผ่าน app-server ของ Codex แทน harness ในตัวของ OpenClaw

ใช้ harness ของ Codex เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง:
การทำงานต่อจากเธรดแบบเนทีฟ, การทำงานต่อของเครื่องมือแบบเนทีฟ, compaction แบบเนทีฟ และ
การดำเนินการผ่าน app-server OpenClaw ยังคงเป็นเจ้าของช่องทางแชต, ไฟล์เซสชัน, การเลือกโมเดล,
เครื่องมือไดนามิกของ OpenClaw, การอนุมัติ, การส่งสื่อ และมิเรอร์ transcript ที่มองเห็นได้

การตั้งค่าปกติใช้ refs โมเดล OpenAI แบบ canonical เช่น `openai/gpt-5.5`
อย่ากำหนดค่า refs GPT ของ Codex แบบ legacy ให้วางลำดับ auth ของเอเจนต์ OpenAI
ไว้ใต้ `auth.order.openai`; id โปรไฟล์ auth Codex แบบ legacy ที่เก่ากว่าและ
รายการลำดับ auth Codex แบบ legacy เป็นสถานะ legacy ที่ซ่อมแซมโดย
`openclaw doctor --fix`

เมื่อไม่มี sandbox ของ OpenClaw ทำงานอยู่ OpenClaw จะเริ่มเธรด app-server ของ Codex
โดยเปิดใช้โหมดโค้ดเนทีฟของ Codex และยังคงปิด code-mode-only ตามค่าเริ่มต้น
วิธีนี้คงความสามารถ workspace และโค้ดแบบเนทีฟของ Codex ไว้ ขณะที่
เครื่องมือไดนามิกของ OpenClaw ยังคงทำงานผ่านบริดจ์ `item/tool/call` ของ app-server
การทำ sandbox ของ OpenClaw ที่ทำงานอยู่และนโยบายเครื่องมือแบบจำกัดจะปิดโหมดโค้ดเนทีฟ
ทั้งหมด เว้นแต่คุณจะเลือกใช้เส้นทาง sandbox exec-server แบบทดลอง

ฟีเจอร์แบบเนทีฟของ Codex นี้แยกจาก
[โหมดโค้ดของ OpenClaw](/th/reference/code-mode) ซึ่งเป็นรันไทม์ QuickJS-WASI
แบบเลือกใช้เองสำหรับการรัน OpenClaw ทั่วไปที่มีรูปแบบอินพุต `exec` ต่างกัน

สำหรับภาพรวมที่กว้างขึ้นของการแบ่งโมเดล/provider/รันไทม์ ให้เริ่มที่
[รันไทม์เอเจนต์](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คือ ref โมเดล, `codex` คือรันไทม์ และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` ที่รวมมาในตัวพร้อมใช้งาน
- หาก config ของคุณใช้ `plugins.allow` ให้รวม `codex` ด้วย
- app-server ของ Codex `0.125.0` หรือใหม่กว่า Plugin ที่รวมมาในตัวจะจัดการไบนารี
  app-server ของ Codex ที่เข้ากันได้ตามค่าเริ่มต้น ดังนั้นคำสั่ง `codex` ในเครื่องบน `PATH` จะไม่
  ส่งผลต่อการเริ่มต้น harness ตามปกติ
- auth ของ Codex ที่พร้อมใช้งานผ่าน `openclaw models auth login --provider openai`,
  บัญชี app-server ใน Codex home ของเอเจนต์ หรือโปรไฟล์ auth แบบ API-key
  ของ Codex ที่ระบุชัดเจน

สำหรับลำดับความสำคัญของ auth, การแยกสภาพแวดล้อม, คำสั่ง app-server แบบกำหนดเอง, การค้นพบโมเดล
และฟิลด์ config ทั้งหมด โปรดดู
[ข้อมูลอ้างอิง harness ของ Codex](/th/plugins/codex-harness-reference)

## เริ่มต้นใช้งานอย่างรวดเร็ว

ผู้ใช้ส่วนใหญ่ที่ต้องการ Codex ใน OpenClaw ต้องการเส้นทางนี้: ลงชื่อเข้าใช้ด้วย
การสมัครสมาชิก ChatGPT/Codex, เปิดใช้ Plugin `codex` ที่รวมมาในตัว และใช้
ref โมเดล `openai/gpt-*` แบบ canonical

ลงชื่อเข้าใช้ด้วย Codex OAuth:

```bash
openclaw models auth login --provider openai
```

เปิดใช้ Plugin `codex` ที่รวมมาในตัวและเลือกโมเดลเอเจนต์ OpenAI:

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

รีสตาร์ท gateway หลังจากเปลี่ยน config ของ Plugin หากแชตที่มีอยู่มี
เซสชันแล้ว ให้ใช้ `/new` หรือ `/reset` ก่อนทดสอบการเปลี่ยนรันไทม์ เพื่อให้รอบถัดไป
resolve harness จาก config ปัจจุบัน

## แชร์เธรดกับ Codex Desktop และ CLI

ค่าเริ่มต้น `appServer.homeScope: "agent"` จะแยกเอเจนต์ OpenClaw แต่ละตัว
ออกจากสถานะ Codex แบบเนทีฟของผู้ปฏิบัติการ หากต้องการให้เจ้าของขอให้ OpenClaw ตรวจสอบ
และจัดการเธรดเนทีฟเดียวกับที่แสดงโดย Codex Desktop และ Codex CLI
ให้เลือกใช้ Codex home ของผู้ใช้:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

โหมด user-home ใช้ได้เฉพาะกับ transport stdio ในเครื่องเท่านั้น โดยใช้
`$CODEX_HOME` เมื่อมีการตั้งค่าไว้ และใช้ `~/.codex` ในกรณีอื่น รวมถึง
auth, config, plugins และ thread store ของ Codex แบบเนทีฟของ home นั้น OpenClaw จะไม่ inject
โปรไฟล์ auth ของ OpenClaw เข้าไปใน app-server นี้

รอบของเจ้าของจะได้รับเครื่องมือ `codex_threads` เครื่องมือนี้สามารถลิสต์, ค้นหา, อ่าน, fork,
เปลี่ยนชื่อ, archive และ restore เธรดเนทีฟได้ ขอให้เอเจนต์ fork เธรดเมื่อ
คุณต้องการทำต่อใน OpenClaw; fork จะถูกแนบกับเซสชัน OpenClaw ปัจจุบัน
และยังคงมองเห็นได้สำหรับไคลเอนต์ Codex แบบเนทีฟอื่น การ archive
ต้องมีการยืนยันอย่างชัดเจนว่าเธรดถูกปิดที่อื่นแล้ว

อย่า resume หรือเขียนเธรดเดียวกันพร้อมกันจาก OpenClaw และไคลเอนต์
Codex อื่น Codex ประสานผู้เขียนสดภายในกระบวนการ app-server หนึ่งตัว ไม่ใช่
ข้ามกระบวนการ Desktop, CLI และ OpenClaw ที่แยกกัน การ fork สร้าง
การทำงานต่อที่แยกต่างหาก และเป็นเส้นทางอยู่ร่วมกันอย่างปลอดภัย

## การกำหนดค่า

config quickstart คือ config harness ของ Codex ขั้นต่ำที่ใช้งานได้ ตั้งค่าตัวเลือก
harness ของ Codex ใน config ของ OpenClaw และใช้ CLI เฉพาะสำหรับ auth ของ Codex:

| ความต้องการ | ตั้งค่า | ที่ไหน |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| เปิดใช้ harness | `plugins.entries.codex.enabled: true` | config ของ OpenClaw |
| คงการติดตั้ง Plugin ที่อยู่ใน allowlist | รวม `codex` ใน `plugins.allow` | config ของ OpenClaw |
| Route รอบเอเจนต์ OpenAI ผ่าน Codex | `agents.defaults.model` หรือ `agents.list[].model` เป็น `openai/gpt-*` | config เอเจนต์ของ OpenClaw |
| ลงชื่อเข้าใช้ด้วย ChatGPT/Codex OAuth | `openclaw models auth login --provider openai` | โปรไฟล์ auth ของ CLI |
| เพิ่ม API-key backup สำหรับการรัน Codex | โปรไฟล์ API-key `openai:*` ที่ลิสต์หลัง auth แบบสมัครสมาชิกใน `auth.order.openai` | โปรไฟล์ auth ของ CLI + config ของ OpenClaw |
| fail closed เมื่อ Codex ไม่พร้อมใช้งาน | provider หรือโมเดล `agentRuntime.id: "codex"` | config โมเดล/provider ของ OpenClaw |
| ใช้ทราฟฟิก OpenAI API โดยตรง | provider หรือโมเดล `agentRuntime.id: "openclaw"` พร้อม auth OpenAI ปกติ | config โมเดล/provider ของ OpenClaw |
| ปรับพฤติกรรม app-server | `plugins.entries.codex.config.appServer.*` | config Plugin ของ Codex |
| เปิดใช้แอป Plugin เนทีฟของ Codex | `plugins.entries.codex.config.codexPlugins.*` | config Plugin ของ Codex |
| เปิดใช้ Codex Computer Use | `plugins.entries.codex.config.computerUse.*` | config Plugin ของ Codex |

ใช้ refs โมเดล `openai/gpt-*` สำหรับรอบเอเจนต์ OpenAI ที่หนุนด้วย Codex ควรใช้
`auth.order.openai` สำหรับการจัดลำดับแบบ subscription-first/API-key-backup โปรไฟล์ auth Codex แบบ legacy
ที่มีอยู่และลำดับ auth Codex แบบ legacy เป็นสถานะ legacy เฉพาะสำหรับ doctor;
อย่าเขียน refs GPT ของ Codex แบบ legacy ใหม่

อย่าตั้ง `compaction.model` หรือ `compaction.provider` บนเอเจนต์ที่หนุนด้วย Codex
Codex ทำ compaction ผ่านสถานะเธรด app-server แบบเนทีฟของตน ดังนั้น OpenClaw จะละเว้น
summarizer overrides ในเครื่องเหล่านั้นที่รันไทม์ และ `openclaw doctor --fix` จะลบ
รายการเหล่านั้นเมื่อเอเจนต์ใช้ Codex

Lossless ยังคงรองรับในฐานะ context engine สำหรับการประกอบ, ingestion และ
การบำรุงรักษารอบการทำงานของ Codex กำหนดค่าผ่าน
`plugins.slots.contextEngine: "lossless-claw"` และ
`plugins.entries.lossless-claw.config.summaryModel` ไม่ใช่ผ่าน
`agents.defaults.compaction.provider` `openclaw doctor --fix` จะ migrate รูปแบบเก่า
`compaction.provider: "lossless-claw"` ไปยัง slot context-engine ของ Lossless
เมื่อ Codex เป็นรันไทม์ที่ทำงานอยู่ แต่ Codex แบบเนทีฟยังคงเป็นเจ้าของ compaction

harness app-server ของ Codex แบบเนทีฟรองรับ context engines ที่ต้องใช้
การประกอบ pre-prompt backend CLI ทั่วไป รวมถึง `codex-cli` ไม่มี
ความสามารถ host นั้น

สำหรับเอเจนต์ที่หนุนด้วย Codex `/compact` จะเริ่ม compaction app-server ของ Codex แบบเนทีฟบน
เธรดที่ผูกอยู่ OpenClaw จะไม่รอให้เสร็จสิ้น, กำหนด timeout ของ OpenClaw,
รีสตาร์ท app-server ที่แชร์ หรือ fallback ไปยัง context-engine หรือ
summarizer OpenAI สาธารณะ หาก binding เธรด Codex แบบเนทีฟหายไปหรือ
ล้าสมัย คำสั่งจะ fail closed เพื่อให้ผู้ปฏิบัติการเห็นขอบเขตรันไทม์จริง
แทนที่จะสลับ backend compaction อย่างเงียบ ๆ

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ในรูปแบบนั้น โปรไฟล์ทั้งสองยังคงรันผ่าน Codex สำหรับรอบเอเจนต์
`openai/gpt-*` API key เป็นเพียง fallback ของ auth ไม่ใช่คำขอให้สลับไปใช้ OpenClaw หรือ
OpenAI Responses แบบธรรมดา

ส่วนที่เหลือของหน้านี้ครอบคลุม variant ทั่วไปที่ผู้ใช้ต้องเลือกระหว่าง:
รูปแบบการ deploy, การ route แบบ fail-closed, นโยบายการอนุมัติ guardian, Plugin
เนทีฟของ Codex และ Computer Use สำหรับรายการตัวเลือกทั้งหมด, ค่าเริ่มต้น, enums, การค้นพบ,
การแยกสภาพแวดล้อม, timeouts และฟิลด์ transport ของ app-server โปรดดู
[ข้อมูลอ้างอิง harness ของ Codex](/th/plugins/codex-harness-reference)

## ตรวจสอบรันไทม์ Codex

ใช้ `/status` ในแชตที่คุณคาดว่าจะใช้ Codex รอบเอเจนต์ OpenAI ที่หนุนด้วย Codex
จะแสดง:

```text
Runtime: OpenAI Codex
```

จากนั้นตรวจสอบสถานะ app-server ของ Codex:

```text
/codex status
/codex models
```

`/codex status` รายงานการเชื่อมต่อ app-server, บัญชี, rate limits, เซิร์ฟเวอร์ MCP
และ skills `/codex models` ลิสต์ catalog app-server สดของ Codex สำหรับ
harness และบัญชี หาก `/status` น่าประหลาดใจ โปรดดู
[การแก้ไขปัญหา](#troubleshooting)

## การ route และการเลือกโมเดล

แยก refs provider และนโยบายรันไทม์ออกจากกัน:

- ใช้ `openai/gpt-*` สำหรับรอบเอเจนต์ OpenAI ผ่าน Codex
- อย่าใช้ refs GPT ของ Codex แบบ legacy ใน config รัน `openclaw doctor --fix` เพื่อ
  ซ่อม refs แบบ legacy และ stale session route pins
- `agentRuntime.id: "codex"` เป็นตัวเลือกสำหรับโหมด auto ของ OpenAI ปกติ แต่มีประโยชน์
  เมื่อ deployment ควร fail closed หาก Codex ไม่พร้อมใช้งาน
- `agentRuntime.id: "openclaw"` เลือก provider หรือโมเดลเข้าไปยังรันไทม์ฝังตัวของ OpenClaw
  เมื่อเป็นความตั้งใจ
- `/codex ...` ควบคุมการสนทนา app-server ของ Codex แบบเนทีฟจากแชต
- ACP/acpx เป็นเส้นทาง harness ภายนอกที่แยกต่างหาก ใช้เฉพาะเมื่อผู้ใช้ขอ
  ACP/acpx หรือ adapter harness ภายนอก

การ route คำสั่งทั่วไป:

| เจตนาของผู้ใช้ | ใช้ |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| แนบแชทปัจจุบัน | `/codex bind [--cwd <path>]` |
| กลับไปทำเธรด Codex ที่มีอยู่ต่อ | `/codex resume <thread-id>` |
| แสดงรายการหรือกรองเธรด Codex | `/codex threads [filter]` |
| แสดงรายการ Plugin Codex แบบเนทีฟ | `/codex plugins list` |
| เปิดหรือปิดใช้งาน Plugin Codex แบบเนทีฟที่กำหนดค่าไว้ | `/codex plugins enable <name>`, `/codex plugins disable <name>` |
| แนบเซสชัน Codex CLI ที่มีอยู่บนโหนดที่จับคู่แล้ว | `/codex sessions --host <node> [filter]`, จากนั้น `/codex resume <session-id> --host <node> --bind here` |
| ส่งฟีดแบ็ก Codex เท่านั้น | `/codex diagnostics [note]` |
| เริ่มงาน ACP/acpx | คำสั่งเซสชัน ACP/acpx ไม่ใช่ `/codex` |

| กรณีใช้งาน | กำหนดค่า | ตรวจสอบ | หมายเหตุ |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| การสมัครใช้งาน ChatGPT/Codex กับรันไทม์ Codex แบบเนทีฟ | `openai/gpt-*` พร้อม Plugin `codex` ที่เปิดใช้งาน | `/status` แสดง `Runtime: OpenAI Codex` | เส้นทางที่แนะนำ |
| ล้มเหลวแบบปิดหาก Codex ไม่พร้อมใช้งาน | Provider หรือโมเดล `agentRuntime.id: "codex"` | เทิร์นล้มเหลวแทนการใช้ตัวสำรองแบบฝัง | ใช้สำหรับการปรับใช้ที่ใช้ Codex เท่านั้น |
| ส่งทราฟฟิกคีย์ OpenAI API โดยตรงผ่าน OpenClaw | Provider หรือโมเดล `agentRuntime.id: "openclaw"` และการยืนยันตัวตน OpenAI ปกติ | `/status` แสดงรันไทม์ OpenClaw | ใช้เฉพาะเมื่อ OpenClaw เป็นสิ่งที่ตั้งใจไว้ |
| การกำหนดค่าเดิม | การอ้างอิง Codex GPT เดิม | `openclaw doctor --fix` เขียนใหม่ | อย่าเขียนการกำหนดค่าใหม่ด้วยวิธีนี้ |
| อะแดปเตอร์ ACP/acpx สำหรับ Codex | ACP `sessions_spawn({ runtime: "acp" })` | สถานะงาน/เซสชัน ACP | แยกจากชุดทดสอบ Codex แบบเนทีฟ |

`agents.defaults.imageModel` ใช้การแยกตามคำนำหน้าแบบเดียวกัน ใช้ `openai/gpt-*`
สำหรับเส้นทาง OpenAI ปกติ และใช้ `codex/gpt-*` เฉพาะเมื่อการทำความเข้าใจภาพ
ควรรันผ่านเทิร์นของแอปเซิร์ฟเวอร์ Codex ที่มีขอบเขตจำกัดเท่านั้น อย่าใช้
การอ้างอิง Codex GPT เดิม; doctor จะเขียนคำนำหน้าเดิมนั้นใหม่เป็น `openai/gpt-*`

## รูปแบบการปรับใช้

### การปรับใช้ Codex พื้นฐาน

ใช้การกำหนดค่า quickstart เมื่อเทิร์นเอเจนต์ OpenAI ทั้งหมดควรใช้ Codex เป็น
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

ด้วยการกำหนดค่านี้ เอเจนต์ `main` ใช้เส้นทาง Provider ปกติของตัวเอง และ
เอเจนต์ `codex` ใช้แอปเซิร์ฟเวอร์ Codex

### การปรับใช้ Codex แบบล้มเหลวเป็นปิด

สำหรับเทิร์นเอเจนต์ OpenAI, `openai/gpt-*` จะแก้ไปเป็น Codex อยู่แล้วเมื่อ
Plugin ที่บันเดิลมาพร้อมใช้งาน เพิ่มนโยบายรันไทม์แบบชัดเจนเมื่อคุณต้องการกฎ
ล้มเหลวเป็นปิดที่เขียนไว้:

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
แอปเซิร์ฟเวอร์เก่าเกินไป หรือแอปเซิร์ฟเวอร์เริ่มทำงานไม่ได้

## นโยบายแอปเซิร์ฟเวอร์

โดยค่าเริ่มต้น Plugin จะเริ่มไบนารี Codex ที่ OpenClaw จัดการไว้ภายในเครื่องด้วย
การขนส่งแบบ stdio ตั้งค่า `appServer.command` เฉพาะเมื่อคุณตั้งใจจะรันไฟล์ปฏิบัติการ
อื่น ใช้การขนส่ง WebSocket เฉพาะเมื่อมีแอปเซิร์ฟเวอร์รันอยู่ที่อื่นแล้ว:

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

เซสชันแอปเซิร์ฟเวอร์ stdio ภายในเครื่องใช้ท่าทีของผู้ปฏิบัติการภายในเครื่องที่เชื่อถือได้เป็นค่าเริ่มต้น:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` หากข้อกำหนด Codex ภายในเครื่องไม่อนุญาตท่าที YOLO
โดยนัยนั้น OpenClaw จะเลือกสิทธิ์ guardian ที่อนุญาตแทน
เมื่อ sandbox ของ OpenClaw ใช้งานอยู่สำหรับเซสชัน OpenClaw จะปิด Code Mode
แบบเนทีฟของ Codex, เซิร์ฟเวอร์ MCP ของผู้ใช้ และการดำเนินการ Plugin ที่มีแอปรองรับสำหรับ
เทิร์นนั้น แทนที่จะพึ่งพา sandbox ฝั่งโฮสต์ของ Codex การเข้าถึงเชลล์ถูกเปิดเผย
ผ่านเครื่องมือไดนามิกที่มี sandbox ของ OpenClaw รองรับ เช่น `sandbox_exec` และ
`sandbox_process` เมื่อเครื่องมือ exec/process ปกติพร้อมใช้งาน

ใช้โหมด exec ของ OpenClaw ที่ปรับเป็นมาตรฐานเมื่อคุณต้องการ auto-review แบบเนทีฟของ Codex ก่อน
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

สำหรับเซสชันแอปเซิร์ฟเวอร์ Codex, OpenClaw จะจับคู่ `tools.exec.mode: "auto"` ไปยังการอนุมัติ
ที่ Guardian ตรวจทานใน Codex โดยปกติคือ
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` และ
`sandbox: "workspace-write"` เมื่อข้อกำหนดภายในเครื่องอนุญาตค่าเหล่านั้น
ใน `tools.exec.mode: "auto"` OpenClaw จะไม่คงการโอเวอร์ไรด์ Codex เดิมที่ไม่ปลอดภัย
`approvalPolicy: "never"` หรือ `sandbox: "danger-full-access"` ไว้; ใช้
`tools.exec.mode: "full"` สำหรับท่าที Codex แบบไม่มีการอนุมัติที่ตั้งใจไว้
พรีเซ็ตเดิม `plugins.entries.codex.config.appServer.mode: "guardian"` ยังใช้งานได้
แต่ `tools.exec.mode: "auto"` คือพื้นผิว OpenClaw ที่ปรับเป็นมาตรฐานแล้ว

สำหรับการเปรียบเทียบระดับโหมดกับการอนุมัติ exec ของโฮสต์และสิทธิ์ ACPX
ดู [โหมดสิทธิ์](/th/tools/permission-modes)

สำหรับทุกฟิลด์ของแอปเซิร์ฟเวอร์ ลำดับการยืนยันตัวตน การแยกสภาพแวดล้อม การค้นพบ และ
พฤติกรรม timeout ดู [เอกสารอ้างอิงชุดทดสอบ Codex](/th/plugins/codex-harness-reference)

## คำสั่งและการวินิจฉัย

Plugin ที่บันเดิลมาจะลงทะเบียน `/codex` เป็นคำสั่ง slash บนทุกช่องทางที่
รองรับคำสั่งข้อความของ OpenClaw

การดำเนินการและการควบคุมแบบเนทีฟต้องใช้เจ้าของหรือไคลเอนต์ Gateway
`operator.admin` ซึ่งรวมถึงการผูกหรือกลับไปทำเธรดต่อ การส่งหรือหยุดเทิร์น
การเปลี่ยนโมเดล fast-mode หรือสถานะสิทธิ์ การ compact หรือการ review และ
การแยกการผูก ผู้ส่งที่ได้รับอนุญาตรายอื่นยังคงใช้คำสั่งตรวจสอบสถานะ วิธีใช้
บัญชี โมเดล เธรด เซิร์ฟเวอร์ MCP, skill และการผูกแบบอ่านอย่างเดียวได้

รูปแบบทั่วไป:

- `/codex status` ตรวจสอบการเชื่อมต่อแอปเซิร์ฟเวอร์ โมเดล บัญชี ขีดจำกัดอัตรา
  เซิร์ฟเวอร์ MCP และ skills
- `/codex models` แสดงรายการโมเดลแอปเซิร์ฟเวอร์ Codex แบบสด
- `/codex threads [filter]` แสดงรายการเธรดแอปเซิร์ฟเวอร์ Codex ล่าสุด
- `/codex resume <thread-id>` แนบเซสชัน OpenClaw ปัจจุบันเข้ากับ
  เธรด Codex ที่มีอยู่
- `/codex compact` ขอให้แอปเซิร์ฟเวอร์ Codex compact เธรดที่แนบอยู่
- `/codex review` เริ่มการ review แบบเนทีฟของ Codex สำหรับเธรดที่แนบอยู่
- `/codex diagnostics [note]` ถามก่อนส่งฟีดแบ็ก Codex สำหรับ
  เธรดที่แนบอยู่
- `/codex account` แสดงสถานะบัญชีและขีดจำกัดอัตรา
- `/codex mcp` แสดงรายการสถานะเซิร์ฟเวอร์ MCP ของแอปเซิร์ฟเวอร์ Codex
- `/codex skills` แสดงรายการ skills ของแอปเซิร์ฟเวอร์ Codex

สำหรับรายงานการสนับสนุนส่วนใหญ่ ให้เริ่มด้วย `/diagnostics [note]` ในบทสนทนา
ที่เกิดบั๊ก คำสั่งนี้สร้างรายงานการวินิจฉัย Gateway หนึ่งรายการ และสำหรับเซสชัน
ชุดทดสอบ Codex จะขออนุมัติเพื่อส่งชุดฟีดแบ็ก Codex ที่เกี่ยวข้อง
ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics) สำหรับโมเดลความเป็นส่วนตัวและพฤติกรรม
ในแชทกลุ่ม

ใช้ `/codex diagnostics [note]` เฉพาะเมื่อคุณต้องการอัปโหลดฟีดแบ็ก Codex
สำหรับเธรดที่แนบอยู่ในปัจจุบันโดยไม่มีชุดการวินิจฉัย Gateway เต็มรูปแบบ

### ตรวจสอบเธรด Codex ภายในเครื่อง

วิธีที่เร็วที่สุดในการตรวจสอบการรัน Codex ที่มีปัญหามักเป็นการเปิดเธรด Codex
แบบเนทีฟโดยตรง:

```bash
codex resume <thread-id>
```

รับ id ของเธรดจากคำตอบ `/diagnostics` ที่เสร็จแล้ว, `/codex binding` หรือ
`/codex threads [filter]`

สำหรับกลไกการอัปโหลดและขอบเขตการวินิจฉัยระดับรันไทม์ ดู
[รันไทม์ชุดทดสอบ Codex](/th/plugins/codex-harness-runtime#codex-feedback-upload)

ในโฮมต่อเอเจนต์ค่าเริ่มต้น การยืนยันตัวตนถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenAI ที่เรียงลำดับไว้สำหรับเอเจนต์ โดยควรอยู่ภายใต้
   `auth.order.openai` รัน `openclaw doctor --fix` เพื่อย้าย
   id โปรไฟล์การยืนยันตัวตน Codex เดิมและลำดับการยืนยันตัวตน Codex เดิม
2. บัญชีที่มีอยู่ของแอปเซิร์ฟเวอร์ในโฮม Codex ของเอเจนต์นั้น
3. สำหรับการเปิดแอปเซิร์ฟเวอร์ stdio ภายในเครื่องเท่านั้น ใช้ `CODEX_API_KEY` จากนั้น
   `OPENAI_API_KEY` เมื่อไม่มีบัญชีแอปเซิร์ฟเวอร์และยังจำเป็นต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์การยืนยันตัวตน Codex แบบการสมัครใช้งาน ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ถูกสร้างขึ้น
สิ่งนี้ทำให้คีย์ API ระดับ Gateway ยังพร้อมใช้งานสำหรับ embeddings หรือโมเดล OpenAI
โดยตรง โดยไม่ทำให้เทิร์นแอปเซิร์ฟเวอร์ Codex แบบเนทีฟคิดค่าใช้จ่ายผ่าน API โดยไม่ตั้งใจ
โปรไฟล์คีย์ API ของ Codex แบบชัดเจนและตัวสำรองคีย์ env ของ stdio ภายในเครื่องใช้การเข้าสู่ระบบ
แอปเซิร์ฟเวอร์แทน env ของกระบวนการลูกที่สืบทอดมา การเชื่อมต่อแอปเซิร์ฟเวอร์ WebSocket
ไม่ได้รับตัวสำรองคีย์ API env ของ Gateway; ใช้โปรไฟล์การยืนยันตัวตนแบบชัดเจนหรือบัญชีของ
แอปเซิร์ฟเวอร์ระยะไกลเอง
เมื่อมีการกำหนดค่า Plugin Codex แบบเนทีฟ OpenClaw จะติดตั้งหรือรีเฟรช Plugin เหล่านั้น
ผ่านแอปเซิร์ฟเวอร์ที่เชื่อมต่อก่อนเปิดเผยแอปที่ Plugin เป็นเจ้าของให้กับ
เธรด Codex `app/list` ยังคงเป็นแหล่งข้อมูลจริงสำหรับ id แอป
การเข้าถึงได้ และเมทาดาทา แต่ OpenClaw เป็นเจ้าของการตัดสินใจเปิดใช้งานต่อเธรด:
หากนโยบายอนุญาตแอปที่เข้าถึงได้ซึ่งอยู่ในรายการ OpenClaw จะส่ง
`thread/start.config.apps[appId].enabled = true` แม้ว่า `app/list` จะรายงานอยู่ในขณะนั้นว่า
แอปนั้นถูกปิดใช้งาน เส้นทางนี้ไม่ได้สร้างการติดตั้งแอปสำหรับ id ที่ไม่รู้จักขึ้นมาเอง;
OpenClaw เปิดใช้งานเฉพาะ Plugin marketplace ด้วย `plugin/install`
แล้วจึงรีเฟรชรายการสินค้าคงคลัง

หากโปรไฟล์การสมัครใช้งานชนขีดจำกัดการใช้งาน Codex, OpenClaw จะบันทึกเวลารีเซ็ต
เมื่อ Codex รายงานมา และลองใช้โปรไฟล์การยืนยันตัวตนลำดับถัดไปสำหรับการรัน Codex เดียวกัน
เมื่อถึงเวลารีเซ็ต โปรไฟล์การสมัครใช้งานจะมีสิทธิ์ใช้งานอีกครั้ง
โดยไม่เปลี่ยนโมเดล `openai/gpt-*` ที่เลือกไว้หรือรันไทม์ Codex

สำหรับการเรียกใช้ app-server แบบ stdio ภายในเครื่อง OpenClaw จะตั้งค่า `CODEX_HOME` เป็นไดเรกทอรีรายเอเจนต์ เพื่อไม่ให้ไฟล์การกำหนดค่า, ไฟล์ auth/account, cache/data ของ Plugin และสถานะเธรดแบบเนทีฟของ Codex อ่านหรือเขียน `~/.codex` ส่วนตัวของผู้ปฏิบัติงานโดยค่าเริ่มต้น OpenClaw จะคงค่า `HOME` ของ process ปกติไว้; subprocess ที่รันโดย Codex ยังสามารถค้นหาการกำหนดค่าและโทเค็นใน user-home ได้ และ Codex อาจค้นพบรายการ `$HOME/.agents/skills` และ `$HOME/.agents/plugins/marketplace.json` ที่ใช้ร่วมกันได้ เมื่อใช้ `appServer.homeScope: "user"` OpenClaw จะใช้ home ของ Codex ผู้ใช้แบบเนทีฟและบัญชีที่มีอยู่แทน โดยไม่ฉีดโปรไฟล์ auth ของ OpenClaw เข้าไป

หากการปรับใช้ต้องการการแยก environment เพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นใน `appServer.clearEnv`:

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

`appServer.clearEnv` มีผลเฉพาะกับ process ลูกของ Codex app-server ที่ถูก spawn เท่านั้น OpenClaw จะนำ `CODEX_HOME` และ `HOME` ออกจากรายการนี้ระหว่างการ normalize การเรียกใช้ภายในเครื่อง: `CODEX_HOME` ยังคงชี้ไปยัง scope ของเอเจนต์หรือผู้ใช้ที่เลือกไว้ และ `HOME` ยังคงสืบทอดมาเพื่อให้ subprocess ใช้สถานะ user-home ปกติได้

dynamic tools ของ Codex ใช้การโหลดแบบ `searchable` เป็นค่าเริ่มต้น OpenClaw จะไม่เปิดเผย dynamic tools ที่ซ้ำกับการดำเนินการ workspace แบบเนทีฟของ Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` และ `update_plan` เครื่องมือ integration ของ OpenClaw ส่วนใหญ่ที่เหลือ เช่น messaging, media, cron, browser, nodes, gateway และ `heartbeat_respond` พร้อมใช้งานผ่านการค้นหาเครื่องมือของ Codex ภายใต้ namespace `openclaw` ซึ่งช่วยให้ context เริ่มต้นของโมเดลมีขนาดเล็กลง การค้นหาเว็บใช้เครื่องมือ `web_search` แบบ hosted ของ Codex เป็นค่าเริ่มต้นเมื่อเปิดใช้การค้นหาและไม่ได้เลือก managed provider การค้นหาแบบ hosted เนทีฟและ dynamic tool `web_search` แบบ managed ของ OpenClaw ใช้ร่วมกันไม่ได้ เพื่อให้ managed search ไม่สามารถเลี่ยงข้อจำกัดโดเมนแบบเนทีฟได้ OpenClaw ใช้เครื่องมือแบบ managed เมื่อ hosted search ไม่พร้อมใช้งาน ถูกปิดใช้อย่างชัดเจน หรือถูกแทนที่ด้วย managed provider ที่เลือกไว้ OpenClaw ยังคงปิดใช้งานส่วนขยาย `web.run` แบบ standalone ของ Codex เพราะทราฟฟิก app-server ใน production ปฏิเสธ namespace `web` ที่ผู้ใช้กำหนด `tools.web.search.enabled: false` จะปิดทั้งสองเส้นทาง เช่นเดียวกับการรันแบบ LLM-only ที่ปิดเครื่องมือไว้ Codex ถือว่า `"cached"` เป็น preference และ resolve เป็นการเข้าถึงภายนอกแบบ live สำหรับ turn ของ app-server ที่ไม่ถูกจำกัด fallback แบบ managed อัตโนมัติจะล้มเหลวแบบปิดเมื่อมีการตั้งค่า native `allowedDomains` เพื่อไม่ให้ allowlist ถูกเลี่ยงได้ การเปลี่ยนแปลง search-policy ที่มีผลถาวรจะหมุนเธรด Codex ที่ผูกไว้ก่อน turn ถัดไป ข้อจำกัดชั่วคราวราย turn จะใช้เธรดจำกัดชั่วคราวและรักษา binding เดิมไว้สำหรับการ resume ในภายหลัง `sessions_yield` และการตอบกลับแหล่งที่มาแบบ message-tool-only ยังคงเป็นแบบ direct เพราะสิ่งเหล่านี้เป็นสัญญา turn-control `sessions_spawn` ยังคงเป็น searchable เพื่อให้ `spawn_agent` แบบเนทีฟของ Codex ยังคงเป็นพื้นผิว subagent หลักของ Codex ขณะที่การ delegation แบบ OpenClaw หรือ ACP อย่างชัดเจนยังคงพร้อมใช้งานผ่าน namespace dynamic tool `openclaw` คำแนะนำการทำงานร่วมกันของ Heartbeat จะบอก Codex ให้ค้นหา `heartbeat_respond` ก่อนจบ heartbeat turn เมื่อเครื่องมือยังไม่ได้ถูกโหลดไว้

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับ Codex app-server แบบกำหนดเองที่ไม่สามารถค้นหา dynamic tools ที่เลื่อนโหลดไว้ได้ หรือเมื่อ debugging payload เครื่องมือแบบเต็ม

ฟิลด์ Plugin Codex ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น        | ความหมาย                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | ใช้ `"direct"` เพื่อวาง dynamic tools ของ OpenClaw ไว้โดยตรงใน context เครื่องมือเริ่มต้นของ Codex |
| `codexDynamicToolsExclude` | `[]`           | ชื่อ dynamic tool ของ OpenClaw เพิ่มเติมที่จะละเว้นจาก turn ของ Codex app-server              |
| `codexPlugins`             | ปิดใช้งาน       | การรองรับ Plugin/app แบบเนทีฟของ Codex สำหรับ curated plugins ที่ย้ายมาและติดตั้งจากซอร์ส           |

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` เรียกใช้ Codex; `"websocket"` เชื่อมต่อกับ `url`                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` แยกสถานะ Codex สำหรับแต่ละเอเจนต์ OpenClaw ส่วน `"user"` ใช้ `$CODEX_HOME` หรือ `~/.codex` แบบเนทีฟร่วมกัน ใช้การยืนยันตัวตนแบบเนทีฟ และเปิดใช้การจัดการเธรดเฉพาะเจ้าของเท่านั้น ขอบเขตผู้ใช้ต้องใช้ stdio                                                                                                                                                                                               |
| `command`                                     | ไบนารี Codex ที่จัดการให้                                   | ไฟล์ปฏิบัติการสำหรับทรานสปอร์ต stdio ปล่อยว่างไว้เพื่อใช้ไบนารีที่จัดการให้ ตั้งค่านี้เฉพาะเมื่อต้องการ override อย่างชัดเจน                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับทรานสปอร์ต stdio                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | ไม่ได้ตั้งค่า                                                  | URL ของ WebSocket app-server                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | ไม่ได้ตั้งค่า                                                  | โทเคน Bearer สำหรับทรานสปอร์ต WebSocket รับได้ทั้งสตริงตามตัวอักษรหรือ SecretInput เช่น `${CODEX_APP_SERVER_TOKEN}`                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | ส่วนหัว WebSocket เพิ่มเติม ค่าส่วนหัวรับสตริงตามตัวอักษรหรือค่า SecretInput ได้ เช่น `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกนำออกจากโปรเซส stdio app-server ที่ถูกเรียกใช้ หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดแล้ว OpenClaw จะคง `CODEX_HOME` ที่เลือกและ `HOME` ที่สืบทอดไว้สำหรับการเปิดใช้งานในเครื่อง                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | เลือกใช้พื้นผิวเครื่องมือเฉพาะโหมดโค้ดของ Codex เครื่องมือไดนามิกของ OpenClaw ยังลงทะเบียนกับ Codex อยู่ เพื่อให้การเรียก `tools.*` แบบซ้อนส่งกลับผ่านบริดจ์ `item/tool/call` ของ app-server                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | ไม่ได้ตั้งค่า                                                  | รากพื้นที่ทำงานของ Codex app-server ระยะไกล เมื่อตั้งค่าแล้ว OpenClaw จะอนุมานรากพื้นที่ทำงานในเครื่องจากพื้นที่ทำงาน OpenClaw ที่แก้ไขแล้ว รักษาส่วนต่อท้าย cwd ปัจจุบันไว้ใต้รากระยะไกลนี้ และส่งเฉพาะ cwd สุดท้ายของ app-server ไปยัง Codex หาก cwd อยู่นอกรากพื้นที่ทำงาน OpenClaw ที่แก้ไขแล้ว OpenClaw จะล้มเหลวแบบปิดกั้นแทนที่จะส่งพาธภายในเครื่องของ Gateway ไปยัง app-server ระยะไกล |
| `requestTimeoutMs`                            | `60000`                                                | ระยะหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | ช่วงเงียบหลังจาก Codex ยอมรับ turn หรือหลังจากคำขอ app-server ที่อยู่ในขอบเขต turn ขณะที่ OpenClaw รอ `turn/completed`                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ตัวคุมภาวะว่างของการเสร็จสมบูรณ์และความคืบหน้าที่ใช้หลังจากส่งต่อเครื่องมือ เครื่องมือเนทีฟเสร็จสิ้น ความคืบหน้า raw assistant หลังใช้เครื่องมือ การเสร็จสิ้น raw reasoning หรือความคืบหน้า reasoning ขณะที่ OpenClaw รอ `turn/completed` ใช้ค่านี้สำหรับงานที่เชื่อถือได้หรืองานหนัก ซึ่งการสังเคราะห์หลังใช้เครื่องมือสามารถเงียบได้นานกว่างบเวลาการปล่อย assistant ขั้นสุดท้ายอย่างสมเหตุสมผล                                |
| `mode`                                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ในเครื่องไม่อนุญาต YOLO | ค่าที่ตั้งไว้ล่วงหน้าสำหรับการดำเนินการแบบ YOLO หรือที่มี guardian ตรวจสอบ ข้อกำหนด stdio ในเครื่องที่ละเว้น `danger-full-access`, การอนุมัติ `never` หรือผู้ตรวจสอบ `user` จะทำให้ค่าเริ่มต้นโดยนัยเป็น guardian                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` หรือนโยบายการอนุมัติของ guardian ที่อนุญาต       | นโยบายการอนุมัติ Codex แบบเนทีฟที่ส่งไปยังการเริ่มเธรด/ทำต่อ/turn ค่าเริ่มต้นของ guardian จะเลือก `"on-request"` เมื่ออนุญาต                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` หรือ sandbox ของ guardian ที่อนุญาต  | โหมด sandbox Codex แบบเนทีฟที่ส่งไปยังการเริ่มเธรด/ทำต่อ ค่าเริ่มต้นของ guardian จะเลือก `"workspace-write"` เมื่ออนุญาต มิฉะนั้นใช้ `"read-only"` เมื่อ sandbox ของ OpenClaw ทำงานอยู่ turn แบบ `danger-full-access` จะใช้ `workspace-write` ของ Codex พร้อมการเข้าถึงเครือข่ายที่ได้จากการตั้งค่า egress ของ sandbox OpenClaw                                                                                     |
| `approvalsReviewer`                           | `"user"` หรือผู้ตรวจสอบ guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจสอบพรอมป์การอนุมัติแบบเนทีฟเมื่ออนุญาต มิฉะนั้นใช้ `guardian_subagent` หรือ `user` โดย `guardian_subagent` ยังคงเป็น alias แบบเดิม                                                                                                                                                                                                                              |
| `serviceTier`                                 | ไม่ได้ตั้งค่า                                                  | ระดับบริการ Codex app-server ที่เป็นตัวเลือก `"priority"` เปิดใช้การกำหนดเส้นทาง fast-mode, `"flex"` ขอการประมวลผลแบบ flex, `null` ล้าง override และ `"fast"` แบบเดิมจะถูกรับเป็น `"priority"`                                                                                                                                                                                                 |
| `networkProxy`                                | ปิดใช้งาน                                               | เลือกใช้เครือข่ายแบบโปรไฟล์สิทธิ์ของ Codex สำหรับคำสั่ง app-server OpenClaw กำหนดค่าคอนฟิก `permissions.<profile>.network` ที่เลือกและเลือกด้วย `default_permissions` แทนการส่ง `sandbox`                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | ตัวเลือกทดลองใช้ preview ที่ลงทะเบียนสภาพแวดล้อม Codex ที่มี sandbox ของ OpenClaw รองรับกับ Codex app-server 0.132.0 หรือใหม่กว่า เพื่อให้การดำเนินการ Codex แบบเนทีฟทำงานภายใน sandbox OpenClaw ที่ใช้งานอยู่ได้                                                                                                                                                                                                         |

`appServer.networkProxy` เป็นแบบชัดเจนเพราะเปลี่ยนสัญญา sandbox ของ Codex
เมื่อเปิดใช้ OpenClaw จะตั้งค่า `features.network_proxy.enabled` และ
`default_permissions` ในคอนฟิกเธรด Codex ด้วย เพื่อให้โปรไฟล์สิทธิ์ที่สร้างขึ้น
เริ่มเครือข่ายที่ Codex จัดการได้ ตามค่าเริ่มต้น OpenClaw จะสร้างชื่อโปรไฟล์
`openclaw-network-<fingerprint>` ที่ทนต่อการชนกันจากเนื้อหาโปรไฟล์
ใช้ `profileName` เฉพาะเมื่อจำเป็นต้องมีชื่อภายในเครื่องที่เสถียร

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
`networkProxy` จะใช้การเข้าถึงระบบไฟล์แบบ workspace สำหรับโปรไฟล์สิทธิ์ที่สร้างขึ้น
การบังคับใช้งานเครือข่ายที่ Codex จัดการคือเครือข่ายแบบ sandbox
ดังนั้นโปรไฟล์ full-access จะไม่ป้องกันทราฟฟิกขาออก
รายการโดเมนใช้ `allow` หรือ `deny`; รายการ Unix socket ใช้ค่า
`allow` หรือ `none` ของ Codex

การเรียกใช้เครื่องมือไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกจาก
`appServer.requestTimeoutMs`: คำขอ Codex `item/tool/call` ใช้ watchdog ของ
OpenClaw 90 วินาทีโดยค่าเริ่มต้น อาร์กิวเมนต์ `timeoutMs` ต่อการเรียกที่เป็นค่าบวกจะขยาย
หรือย่อ budget ของเครื่องมือนั้นโดยเฉพาะ เครื่องมือ `image_generate` ใช้
`agents.defaults.imageGenerationModel.timeoutMs` เมื่อการเรียกเครื่องมือไม่ได้
ระบุ timeout ของตัวเอง หรือใช้ค่าเริ่มต้นสำหรับการสร้างภาพ 120 วินาทีในกรณีอื่น
เครื่องมือ `image` สำหรับการทำความเข้าใจสื่อใช้
`tools.media.image.timeoutSeconds` หรือค่าเริ่มต้นสำหรับสื่อ 60 วินาทีของมัน สำหรับการทำความเข้าใจภาพ
timeout นั้นใช้กับตัวคำขอเอง และจะไม่ถูกลดลงจากงานเตรียมการก่อนหน้า
budget ของเครื่องมือไดนามิกถูกจำกัดไว้ที่ 600000 ms เมื่อ timeout OpenClaw จะยกเลิก signal ของเครื่องมือ
เมื่อรองรับ และส่งคืนการตอบสนองเครื่องมือไดนามิกที่ล้มเหลวให้ Codex เพื่อให้ turn
ดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`
watchdog นี้คือ budget ชั้นนอกของ `item/tool/call` แบบไดนามิก; timeout ของคำขอเฉพาะ provider
จะทำงานอยู่ภายในการเรียกนั้นและคงความหมายของ timeout ของตัวเองไว้

หลังจาก Codex ยอมรับ turn และหลังจาก OpenClaw ตอบสนองต่อคำขอ app-server
ที่มีขอบเขตตาม turn แล้ว harness คาดว่า Codex จะสร้างความคืบหน้าใน turn ปัจจุบันและ
จบ native turn ด้วย `turn/completed` ในที่สุด หาก app-server เงียบเป็นเวลา
`appServer.turnCompletionIdleTimeoutMs` OpenClaw จะพยายาม interrupt
turn ของ Codex แบบ best-effort บันทึก timeout เชิงวินิจฉัย และปล่อย lane ของเซสชัน
OpenClaw เพื่อให้ข้อความแชตถัดไปไม่ถูกคิวไว้หลัง native turn ที่ค้างอยู่
การแจ้งเตือนส่วนใหญ่ที่ไม่ใช่ terminal สำหรับ turn เดียวกันจะปลดอาวุธ watchdog สั้นนี้
เพราะ Codex ได้พิสูจน์แล้วว่า turn ยังมีชีวิตอยู่ การส่งต่อเครื่องมือใช้
budget idle หลังเครื่องมือที่ยาวกว่า: หลังจาก OpenClaw ส่งคืนการตอบสนอง `item/tool/call`,
หลังจากรายการเครื่องมือ native เช่น `commandExecution` เสร็จสิ้น, หลังจากการเสร็จสิ้น
`custom_tool_call_output` แบบดิบ, และหลังจากความคืบหน้าของ assistant แบบดิบหลังเครื่องมือ,
การเสร็จสิ้น reasoning แบบดิบ, หรือความคืบหน้า reasoning guard ใช้
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` เมื่อกำหนดค่าไว้ และ
ใช้ค่าเริ่มต้นเป็นห้านาทีในกรณีอื่น budget หลังเครื่องมือเดียวกันนั้นยังขยาย
progress watchdog สำหรับช่วง synthesis ที่เงียบก่อนที่ Codex จะ emit เหตุการณ์ turn ปัจจุบันถัดไป
การแจ้งเตือน app-server แบบ global เช่นการอัปเดต rate-limit
จะไม่รีเซ็ตความคืบหน้า turn-idle การเสร็จสิ้น reasoning, การเสร็จสิ้น `agentMessage`
ใน commentary, และความคืบหน้า reasoning หรือ assistant แบบดิบก่อนเครื่องมือ
อาจตามด้วยการตอบกลับสุดท้ายอัตโนมัติได้ จึงใช้ guard ตอบกลับหลังความคืบหน้า
แทนการปล่อย lane ของเซสชันทันที เฉพาะรายการ `agentMessage` ที่เสร็จสิ้นแบบ final/non-commentary
และการเสร็จสิ้น assistant แบบดิบก่อนเครื่องมือเท่านั้นที่ arm การปล่อย assistant-output:
หากจากนั้น Codex เงียบโดยไม่มี `turn/completed` OpenClaw จะ interrupt native turn แบบ best-effort
และปล่อย lane ของเซสชัน หาก turn watch อื่นชนะการแข่งขันปล่อยนั้น
OpenClaw ยังยอมรับรายการ assistant สุดท้ายที่เสร็จสิ้นแล้ว เมื่อไม่มีคำขอ native,
รายการ, หรือการเสร็จสิ้นเครื่องมือไดนามิกที่ยังทำงานอยู่ และการปล่อย assistant-output
ยังเป็นของรายการที่เสร็จสิ้นล่าสุด โดยไม่มีการเสร็จสิ้นรายการที่ตามมา
สิ่งนี้สามารถรักษาคำตอบสุดท้ายหลังจากงานเครื่องมือที่เสร็จสิ้นแล้วโดยไม่ replay turn
เดลต้า assistant บางส่วน, คำตอบก่อนหน้าที่ stale, และการเสร็จสิ้นภายหลังที่ว่างเปล่า
จะไม่เข้าเงื่อนไข ความล้มเหลวของ app-server ผ่าน stdio ที่ replay-safe
รวมถึง timeout ของ turn-completion idle ที่ไม่มีหลักฐาน assistant, เครื่องมือ, active-item,
หรือ side-effect จะถูก retry หนึ่งครั้งบนความพยายาม app-server ใหม่
timeout ที่ไม่ปลอดภัยจะยัง retire ไคลเอนต์ app-server ที่ค้างอยู่และปล่อย lane ของเซสชัน OpenClaw
นอกจากนี้ยังล้าง binding ของ native thread ที่ stale แทนที่จะถูก replay โดยอัตโนมัติ
timeout ของ completion-watch แสดงข้อความ timeout เฉพาะ Codex: กรณี replay-safe
จะบอกว่าการตอบสนองอาจไม่สมบูรณ์ ขณะที่กรณีไม่ปลอดภัย
จะบอกผู้ใช้ให้ตรวจสอบสถานะปัจจุบันก่อน retry การวินิจฉัย timeout แบบสาธารณะ
รวมฟิลด์เชิงโครงสร้าง เช่น method การแจ้งเตือน app-server ล่าสุด,
id/type/role ของ raw assistant response item, จำนวน request/item ที่ active, และสถานะ watch ที่ armed
เมื่อการแจ้งเตือนล่าสุดเป็น raw assistant response item ก็จะรวม preview ข้อความ assistant
แบบจำกัดด้วย โดยไม่รวม prompt ดิบหรือเนื้อหาเครื่องมือ

environment override ยังคงพร้อมใช้สำหรับการทดสอบภายในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ข้าม binary ที่จัดการไว้เมื่อ
`appServer.command` ไม่ได้ถูกตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบภายในเครื่องแบบครั้งเดียว ควรใช้ config
สำหรับการ deploy ที่ทำซ้ำได้ เพราะทำให้พฤติกรรม Plugin อยู่ในไฟล์ที่ผ่านการ review เดียวกัน
กับการตั้งค่า harness ของ Codex ส่วนที่เหลือ

## Plugin native ของ Codex

การรองรับ Plugin native ของ Codex ใช้ความสามารถ app และ Plugin ของ app-server ของ Codex เอง
ใน thread ของ Codex เดียวกันกับ turn ของ harness OpenClaw OpenClaw
ไม่แปล Plugin ของ Codex เป็นเครื่องมือไดนามิก OpenClaw แบบสังเคราะห์
`codex_plugin_*`

`codexPlugins` มีผลเฉพาะกับเซสชันที่เลือก harness native ของ Codex เท่านั้น
ไม่มีผลกับการรัน harness ในตัว, การรัน provider OpenAI ปกติ, binding การสนทนา ACP,
หรือ harness อื่น

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

config ของ thread app จะถูกคำนวณเมื่อ OpenClaw สร้างเซสชัน harness ของ Codex
หรือแทนที่ binding ของ Codex thread ที่ stale โดยจะไม่คำนวณใหม่ทุก turn
หลังจากเปลี่ยน `codexPlugins` ให้ใช้ `/new`, `/reset`, หรือ restart gateway เพื่อให้
เซสชัน harness ของ Codex ในอนาคตเริ่มด้วยชุด app ที่อัปเดตแล้ว

สำหรับ eligibility ของ migration, inventory ของ app, นโยบาย destructive action,
elicitations, และการวินิจฉัย Plugin native โปรดดู
[Plugin native ของ Codex](/th/plugins/codex-native-plugins)

การเข้าถึง app และ Plugin ฝั่ง OpenAI ถูกควบคุมโดยบัญชี Codex ที่ลงชื่อเข้าใช้
และสำหรับ workspace Business และ Enterprise/Edu จะถูกควบคุมโดย workspace app controls ดู
[การใช้ Codex กับแผน ChatGPT ของคุณ](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
สำหรับภาพรวมของบัญชีและ workspace-control ของ OpenAI

## Computer Use

Computer Use มีคู่มือการตั้งค่าของตัวเอง:
[Codex Computer Use](/th/plugins/codex-computer-use)

สรุปสั้น ๆ: OpenClaw ไม่ได้ vendor แอปควบคุมเดสก์ท็อปหรือ execute
การกระทำบนเดสก์ท็อปเอง แต่จะเตรียม Codex app-server, ตรวจสอบว่า
MCP server `computer-use` พร้อมใช้งาน, แล้วให้ Codex เป็นเจ้าของการเรียกเครื่องมือ MCP native
ระหว่าง turn ในโหมด Codex

## ขอบเขตรันไทม์

harness ของ Codex เปลี่ยนเฉพาะ executor ของ agent แบบ embedded ระดับล่างเท่านั้น

- รองรับเครื่องมือไดนามิกของ OpenClaw Codex ขอให้ OpenClaw execute
  เครื่องมือเหล่านั้น ดังนั้น OpenClaw จึงยังอยู่ในเส้นทาง execution
- shell, patch, MCP, และเครื่องมือ native app ที่เป็น native ของ Codex เป็นของ Codex
  OpenClaw สามารถสังเกตหรือบล็อกเหตุการณ์ native ที่เลือกผ่าน relay ที่รองรับ
  แต่จะไม่เขียนอาร์กิวเมนต์เครื่องมือ native ใหม่
- Codex เป็นเจ้าของ Compaction native OpenClaw เก็บ transcript mirror สำหรับประวัติ channel,
  การค้นหา, `/new`, `/reset`, และการสลับ model หรือ harness ในอนาคต แต่
  ไม่ได้แทนที่ Compaction ของ Codex ด้วย summarizer ของ OpenClaw หรือ context-engine
- การสร้างสื่อ, การทำความเข้าใจสื่อ, TTS, approval, และ output ของ messaging-tool
  ยังคงผ่านการตั้งค่า provider/model ของ OpenClaw ที่ตรงกัน
- `tool_result_persist` ใช้กับผลลัพธ์เครื่องมือ transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่
  ระเบียนผลลัพธ์เครื่องมือ native ของ Codex

สำหรับ hook layer, surface V1 ที่รองรับ, การจัดการสิทธิ์ native, การควบคุม queue,
กลไกการอัปโหลด feedback ของ Codex, และรายละเอียด Compaction โปรดดู
[รันไทม์ harness ของ Codex](/th/plugins/codex-harness-runtime)

## การแก้ไขปัญหา

**Codex ไม่ปรากฏเป็น provider `/model` ปกติ:** นี่เป็นสิ่งที่คาดไว้สำหรับ
config ใหม่ เลือก model `openai/gpt-*`, เปิดใช้
`plugins.entries.codex.enabled`, และตรวจสอบว่า `plugins.allow` exclude
`codex` หรือไม่

**OpenClaw ใช้ harness ในตัวแทน Codex:** ตรวจสอบให้แน่ใจว่า model ref เป็น
`openai/gpt-*` บน provider OpenAI อย่างเป็นทางการ และ Plugin Codex
ติดตั้งและเปิดใช้แล้ว หากคุณต้องการหลักฐานที่เข้มงวดขณะทดสอบ ให้ตั้งค่า provider หรือ
model `agentRuntime.id: "codex"` รันไทม์ Codex ที่ถูกบังคับจะล้มเหลวแทนที่จะ
fallback ไป OpenClaw

**รันไทม์ OpenAI Codex fallback ไปยังเส้นทาง API-key:** รวบรวม excerpt ของ
gateway ที่ redact แล้วซึ่งแสดง model, runtime, provider ที่เลือก, และความล้มเหลว
ขอให้ผู้ร่วมงานที่ได้รับผลกระทบรันคำสั่ง read-only นี้บน host OpenClaw ของพวกเขา:

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

excerpt ที่มีประโยชน์มักรวม `openai/gpt-5.5` หรือ `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` หรือ `harnessRuntime`,
`candidateProvider: "openai"`, และผลลัพธ์ `401`, `Incorrect API key`, หรือ
`No API key` การรันที่แก้ไขแล้วควรแสดงเส้นทาง OpenAI OAuth
แทนความล้มเหลว OpenAI API-key ธรรมดา

**config model refs ของ Codex แบบ legacy ยังคงอยู่:** รัน `openclaw doctor --fix`
Doctor จะเขียน model refs แบบ legacy ใหม่เป็น `openai/*`, ลบ session ที่ stale และ
runtime pins ทั้ง agent, และคง auth-profile override ที่มีอยู่ไว้

**app-server ถูกปฏิเสธ:** ใช้ Codex app-server `0.125.0` หรือใหม่กว่า
prerelease เวอร์ชันเดียวกันหรือเวอร์ชันที่มี suffix build เช่น
`0.125.0-alpha.2` หรือ `0.125.0+custom` จะถูกปฏิเสธ เพราะ OpenClaw ทดสอบ
protocol floor แบบ stable `0.125.0`

**`/codex status` ไม่สามารถเชื่อมต่อ:** ตรวจสอบว่า Plugin `codex` ที่ bundle มา
เปิดใช้แล้ว, `plugins.allow` รวมมันไว้เมื่อมีการกำหนด allowlist, และ
`appServer.command`, `url`, `authToken`, หรือ headers แบบกำหนดเองใด ๆ ถูกต้อง

**การค้นพบ model ช้า:** ลด
`plugins.entries.codex.config.discovery.timeoutMs` หรือปิดใช้ discovery ดู
[อ้างอิง harness ของ Codex](/th/plugins/codex-harness-reference#model-discovery)

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`,
headers, และว่า app-server ระยะไกลพูด protocol version ของ Codex app-server เดียวกัน

**เครื่องมือเชลล์หรือแพตช์แบบเนทีฟถูกบล็อกด้วย `Native hook relay unavailable`:**
เธรด Codex ยังคงพยายามใช้รหัสรีเลย์ฮุกแบบเนทีฟที่ OpenClaw ไม่ได้ลงทะเบียนไว้อีกต่อไป นี่เป็นปัญหาการขนส่งฮุกแบบเนทีฟของ Codex ไม่ใช่ความล้มเหลวของแบ็กเอนด์ ACP, ผู้ให้บริการ, GitHub หรือคำสั่งเชลล์ เริ่มเซสชันใหม่ในแชตที่ได้รับผลกระทบด้วย `/new` หรือ `/reset` แล้วลองใช้คำสั่งที่ไม่เป็นอันตรายอีกครั้ง หากใช้งานได้ครั้งหนึ่งแต่การเรียกเครื่องมือเนทีฟครั้งถัดไปล้มเหลวอีก ให้ถือว่า `/new` เป็นเพียงวิธีแก้ปัญหาชั่วคราว: คัดลอกพรอมป์ไปยังเซสชันใหม่หลังจากรีสตาร์ทแอปเซิร์ฟเวอร์ Codex หรือ OpenClaw Gateway เพื่อให้เธรดเก่าถูกทิ้งและการลงทะเบียนฮุกแบบเนทีฟถูกสร้างขึ้นใหม่

**โมเดลที่ไม่ใช่ Codex ใช้ฮาร์เนสในตัว:** นี่เป็นสิ่งที่คาดไว้ เว้นแต่นโยบายรันไทม์ของผู้ให้บริการหรือโมเดลจะกำหนดเส้นทางไปยังฮาร์เนสอื่น การอ้างอิงผู้ให้บริการที่ไม่ใช่ OpenAI แบบธรรมดาจะยังอยู่บนเส้นทางผู้ให้บริการปกติในโหมด `auto`

**ติดตั้ง Computer Use แล้วแต่เครื่องมือไม่ทำงาน:** ตรวจสอบ
`/codex computer-use status` จากเซสชันใหม่ หากเครื่องมือรายงาน
`Native hook relay unavailable` ให้ใช้การกู้คืนรีเลย์ฮุกแบบเนทีฟด้านบน ดู
[Codex Computer Use](/th/plugins/codex-computer-use#troubleshooting)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงฮาร์เนส Codex](/th/plugins/codex-harness-reference)
- [รันไทม์ฮาร์เนส Codex](/th/plugins/codex-harness-runtime)
- [Plugin Codex แบบเนทีฟ](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [ความช่วยเหลือ OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin ฮาร์เนสของเอเจนต์](/th/plugins/sdk-agent-harness)
- [ฮุกของ Plugin](/th/plugins/hooks)
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
- [สถานะ](/th/cli/status)
- [การทดสอบ](/th/help/testing-live#live-codex-app-server-harness-smoke)
