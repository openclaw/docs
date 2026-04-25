---
read_when:
    - คุณต้องการใช้ bundled Codex app-server harness
    - คุณต้องการตัวอย่าง config ของ Codex harness
    - คุณต้องการให้การติดตั้งใช้งานที่ใช้ Codex เท่านั้นล้มเหลวแทนที่จะ fallback ไปที่ PI
summary: รันเทิร์นของเอเจนต์แบบฝังในตัวของ OpenClaw ผ่าน bundled Codex app-server harness
title: Codex harness
x-i18n:
    generated_at: "2026-04-25T13:52:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

bundled `codex` Plugin ช่วยให้ OpenClaw สามารถรันเทิร์นของเอเจนต์แบบฝังในตัวผ่าน
Codex app-server แทน PI harness ที่มีมาในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นเจ้าของเซสชันเอเจนต์ระดับล่าง: การค้นหา
model, การกลับมาทำงานต่อของ thread แบบ native, Compaction แบบ native และการรันผ่าน
app-server ขณะที่ OpenClaw ยังคงเป็นเจ้าของ chat channels, ไฟล์เซสชัน, การเลือก model, tools,
approvals, การส่งสื่อ และ transcript mirror ที่ผู้ใช้มองเห็นได้

หากคุณกำลังเริ่มทำความเข้าใจ ให้เริ่มจาก
[Agent runtimes](/th/concepts/agent-runtimes) สรุปสั้น ๆ คือ:
`openai/gpt-5.5` คือ model ref, `codex` คือ runtime และ Telegram,
Discord, Slack หรือช่องทางอื่นยังคงเป็นพื้นผิวการสื่อสาร

เทิร์นแบบ native Codex ยังคงใช้ Plugin hooks ของ OpenClaw เป็นชั้นความเข้ากันได้สาธารณะ
สิ่งเหล่านี้คือ hooks ของ OpenClaw ในโปรเซส ไม่ใช่ command hooks ของ Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` สำหรับระเบียน transcript แบบ mirrored
- `agent_end`

Plugins ยังสามารถลงทะเบียน middleware ที่เป็นกลางต่อ runtime สำหรับผลลัพธ์ของ tool เพื่อเขียนผลลัพธ์ของ dynamic tool ใน OpenClaw ใหม่หลังจาก OpenClaw รัน tool แล้ว และก่อนที่ผลลัพธ์จะถูกส่งกลับไปยัง Codex สิ่งนี้แยกจาก
Plugin hook สาธารณะ `tool_result_persist` ซึ่งแปลงการเขียนผลลัพธ์ของ tool ลง transcript ที่ OpenClaw เป็นเจ้าของ

สำหรับความหมายของ Plugin hook เอง ดู [Plugin hooks](/th/plugins/hooks)
และ [Plugin guard behavior](/th/tools/plugin)

harness นี้ปิดอยู่เป็นค่าเริ่มต้น สำหรับ config ใหม่ควรเก็บ OpenAI model refs
ให้อยู่ในรูป canonical เป็น `openai/gpt-*` และบังคับอย่างชัดเจนด้วย
`embeddedHarness.runtime: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex` เมื่อต้องการ
การรันแบบ native app-server ส่วน `codex/*` model refs แบบเดิมยังคงเลือก
harness โดยอัตโนมัติเพื่อความเข้ากันได้ แต่ provider prefixes แบบเดิมที่มี runtime อยู่เบื้องหลังจะไม่ถูกแสดงเป็นตัวเลือก model/provider ปกติ

## เลือก model prefix ที่ถูกต้อง

เส้นทางตระกูล OpenAI แยกตาม prefix ใช้ `openai-codex/*` เมื่อคุณต้องการ
Codex OAuth ผ่าน PI; ใช้ `openai/*` เมื่อคุณต้องการเข้าถึง OpenAI API โดยตรง หรือ
เมื่อต้องการบังคับใช้ native Codex app-server harness:

| Model ref                                             | เส้นทาง runtime                             | ใช้เมื่อ                                                                    |
| ----------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenAI provider ผ่าน plumbing ของ OpenClaw/PI | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงในปัจจุบันด้วย `OPENAI_API_KEY` |
| `openai-codex/gpt-5.5`                                | OpenAI Codex OAuth ผ่าน OpenClaw/PI         | คุณต้องการใช้การยืนยันตัวตนแบบ ChatGPT/Codex subscription กับ PI runner ค่าเริ่มต้น |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                    | คุณต้องการการรันแบบ native Codex app-server สำหรับเทิร์นของเอเจนต์แบบฝังในตัว |

ขณะนี้ GPT-5.5 ใน OpenClaw รองรับเฉพาะ subscription/OAuth เท่านั้น ใช้
`openai-codex/gpt-5.5` สำหรับ PI OAuth หรือใช้ `openai/gpt-5.5` พร้อม Codex
app-server harness การเข้าถึงแบบ direct API key สำหรับ `openai/gpt-5.5` จะรองรับ
เมื่อ OpenAI เปิดใช้งาน GPT-5.5 บน public API

`codex/gpt-*` refs แบบเดิมยังคงยอมรับได้ในฐานะ alias เพื่อความเข้ากันได้ Doctor
compatibility migration จะเขียน primary runtime refs แบบเดิมใหม่ให้เป็น canonical model
refs และบันทึกนโยบาย runtime แยกต่างหาก ขณะที่ refs แบบเดิมที่เป็น fallback อย่างเดียวจะไม่ถูกเปลี่ยน เพราะ runtime ถูกกำหนดค่าสำหรับ container ของเอเจนต์ทั้งตัว
สำหรับ config ใหม่ที่ใช้ PI Codex OAuth ควรใช้ `openai-codex/gpt-*`; สำหรับ config ใหม่ที่ใช้ native
app-server harness ควรใช้ `openai/gpt-*` ร่วมกับ
`embeddedHarness.runtime: "codex"`

`agents.defaults.imageModel` ใช้การแยก prefix แบบเดียวกัน ใช้
`openai-codex/gpt-*` เมื่อความเข้าใจภาพควรรันผ่านเส้นทาง OpenAI
Codex OAuth provider ใช้ `codex/gpt-*` เมื่อความเข้าใจภาพควรรัน
ผ่าน bounded Codex app-server turn โดย Codex app-server model ต้อง
ประกาศการรองรับ image input; Codex models ที่รองรับเฉพาะข้อความจะล้มเหลวก่อนเริ่ม media turn

ใช้ `/status` เพื่อยืนยัน effective harness สำหรับเซสชันปัจจุบัน หากการเลือกดูผิดคาด ให้เปิด debug logging สำหรับ subsystem `agents/harness`
และตรวจสอบระเบียนแบบมีโครงสร้าง `agent harness selected` ของ gateway ซึ่ง
มี harness id ที่ถูกเลือก เหตุผลในการเลือก นโยบาย runtime/fallback และ
ในโหมด `auto` จะมีผลการรองรับของผู้สมัครจาก Plugin แต่ละตัว

การเลือก harness ไม่ใช่ตัวควบคุมเซสชันแบบสด เมื่อมีการรันเทิร์นแบบฝังในตัว
OpenClaw จะบันทึก harness id ที่ถูกเลือกไว้ในเซสชันนั้น และใช้งานต่อไป
สำหรับเทิร์นถัด ๆ มาใน session id เดียวกัน เปลี่ยน config `embeddedHarness` หรือ
`OPENCLAW_AGENT_RUNTIME` เมื่อคุณต้องการให้เซสชันในอนาคตใช้ harness อื่น; ใช้ `/new` หรือ `/reset` เพื่อเริ่มเซสชันใหม่ก่อนสลับการสนทนาเดิมระหว่าง PI และ Codex วิธีนี้ช่วยหลีกเลี่ยงการเล่น transcript เดียวกันซ้ำผ่านสองระบบ native session ที่ไม่เข้ากัน

เซสชันแบบเดิมที่สร้างขึ้นก่อนมี harness pins จะถือว่าถูก pin ไปที่ PI เมื่อ
มี transcript history แล้ว ใช้ `/new` หรือ `/reset` เพื่อเปลี่ยนการสนทนานั้นไปใช้
Codex หลังจากเปลี่ยน config

`/status` จะแสดง effective model runtime โดย PI harness ค่าเริ่มต้นจะแสดงเป็น
`Runtime: OpenClaw Pi Default` และ Codex app-server harness จะแสดงเป็น
`Runtime: OpenAI Codex`

## ข้อกำหนด

- OpenClaw ที่มี bundled `codex` Plugin พร้อมใช้งาน
- Codex app-server `0.118.0` หรือใหม่กว่า
- ต้องมี Codex auth ให้กับโปรเซส app-server

Plugin จะบล็อก handshakes ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน
วิธีนี้ช่วยให้ OpenClaw อยู่บนพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้ว

สำหรับการทดสอบแบบสดและ Docker smoke auth มักมาจาก `OPENAI_API_KEY` พร้อมไฟล์ Codex CLI แบบไม่บังคับ เช่น `~/.codex/auth.json` และ
`~/.codex/config.toml` ให้ใช้ข้อมูลยืนยันตัวตนชุดเดียวกับที่ local Codex app-server ของคุณใช้

## config ขั้นต่ำ

ใช้ `openai/gpt-5.5` เปิดใช้ bundled Plugin และบังคับ `codex` harness:

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
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

หาก config ของคุณใช้ `plugins.allow` ให้รวม `codex` ไว้ด้วย:

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

config แบบเดิมที่ตั้ง `agents.defaults.model` หรือ model ของ agent เป็น
`codex/<model>` จะยังคงเปิดใช้ bundled `codex` Plugin โดยอัตโนมัติ สำหรับ config ใหม่ควร
ใช้ `openai/<model>` ร่วมกับรายการ `embeddedHarness` แบบชัดเจนด้านบน

## เพิ่ม Codex ควบคู่กับ models อื่น

อย่าตั้ง `runtime: "codex"` แบบโกลบอล หาก agent เดียวกันควรสลับ
ระหว่าง Codex และ provider models อื่นได้อย่างอิสระ runtime ที่ถูกบังคับจะมีผลกับทุก embedded turn สำหรับ agent หรือเซสชันนั้น หากคุณเลือก Anthropic model ขณะที่ runtime นั้นถูกบังคับ OpenClaw จะยังคงพยายามใช้ Codex harness และล้มเหลวแบบ fail-closed แทนที่จะส่งเทิร์นนั้นผ่าน PI อย่างเงียบ ๆ

ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้แทน:

- วาง Codex ไว้บน agent เฉพาะที่มี `embeddedHarness.runtime: "codex"`
- ให้ agent ค่าเริ่มต้นใช้ `runtime: "auto"` และ PI fallback สำหรับการใช้งาน
  แบบผสมผู้ให้บริการตามปกติ
- ใช้ `codex/*` refs แบบเดิมเพื่อความเข้ากันได้เท่านั้น สำหรับ config ใหม่ควรใช้
  `openai/*` ร่วมกับนโยบาย Codex runtime แบบชัดเจน

ตัวอย่างเช่น แบบนี้จะให้ agent ค่าเริ่มต้นคงอยู่บนการเลือกอัตโนมัติปกติ และ
เพิ่ม Codex agent แยกต่างหาก:

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
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
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
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

ด้วยรูปแบบนี้:

- agent `main` ค่าเริ่มต้นใช้เส้นทาง provider ปกติและ PI compatibility fallback
- agent `codex` ใช้ Codex app-server harness
- หาก Codex หายไปหรือไม่รองรับสำหรับ agent `codex` เทิร์นนั้นจะล้มเหลว
  แทนที่จะใช้ PI อย่างเงียบ ๆ

## การติดตั้งใช้งานที่ใช้ Codex เท่านั้น

บังคับ Codex harness เมื่อคุณต้องการพิสูจน์ว่า embedded agent turn ทุกครั้ง
ใช้ Codex โดย explicit plugin runtimes จะไม่มี PI fallback เป็นค่าเริ่มต้น ดังนั้น
`fallback: "none"` จึงเป็นตัวเลือก แต่ก็มักมีประโยชน์ในฐานะเอกสารประกอบ:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

แทนที่ด้วย environment:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

เมื่อบังคับใช้ Codex แล้ว OpenClaw จะล้มเหลวตั้งแต่ต้นหาก Codex Plugin ถูกปิดใช้งาน
app-server เก่าเกินไป หรือ app-server ไม่สามารถเริ่มทำงานได้ ตั้งค่า
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` เฉพาะเมื่อคุณตั้งใจให้ PI จัดการ
กรณีที่ไม่มีการเลือก harness เท่านั้น

## Codex รายเอเจนต์

คุณสามารถทำให้เอเจนต์ตัวหนึ่งใช้ Codex เท่านั้น ขณะที่เอเจนต์ค่าเริ่มต้นยังคงใช้
auto-selection ปกติ:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

ใช้คำสั่งเซสชันปกติเพื่อสลับ agents และ models `/new` จะสร้าง
เซสชัน OpenClaw ใหม่ และ Codex harness จะสร้างหรือกลับมาใช้ sidecar app-server
thread ตามต้องการ ส่วน `/reset` จะล้างการผูกเซสชัน OpenClaw สำหรับ thread นั้น
และปล่อยให้เทิร์นถัดไป resolve harness จาก config ปัจจุบันอีกครั้ง

## การค้นหา model

โดยค่าเริ่มต้น Codex Plugin จะถาม app-server เพื่อขอ models ที่พร้อมใช้งาน หาก
การค้นหาล้มเหลวหรือ timeout มันจะใช้ bundled fallback catalog สำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

คุณสามารถปรับแต่งการค้นหาได้ภายใต้ `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

ปิดการค้นหาเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และยึด
fallback catalog:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## การเชื่อมต่อ app-server และนโยบาย

โดยค่าเริ่มต้น Plugin จะเริ่ม Codex ในเครื่องด้วย:

```bash
codex app-server --listen stdio://
```

โดยค่าเริ่มต้น OpenClaw จะเริ่ม local Codex harness sessions ในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือท่าทีของผู้ปฏิบัติการในเครื่องที่เชื่อถือได้ซึ่งใช้
สำหรับ Heartbeat แบบอัตโนมัติ: Codex สามารถใช้ shell และ network tools ได้โดยไม่หยุดที่ native approval prompts ที่ไม่มีใครอยู่เพื่อตอบ

หากต้องการเลือกใช้ approvals แบบมีการทบทวนโดย Codex guardian ให้ตั้ง `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

โหมด Guardian ใช้เส้นทาง native auto-review approval ของ Codex เมื่อ Codex ขอ
ออกจาก sandbox เขียนนอก workspace หรือเพิ่มสิทธิ์อย่างการเข้าถึงเครือข่าย
Codex จะส่งคำขออนุมัตินั้นไปยัง native reviewer แทน human prompt
reviewer จะใช้กรอบความเสี่ยงของ Codex และอนุมัติหรือปฏิเสธคำขอเฉพาะนั้น ใช้ Guardian เมื่อคุณต้องการราวป้องกันมากกว่าโหมด YOLO
แต่ยังต้องการให้เอเจนต์แบบไม่ต้องเฝ้ายังคงทำงานต่อได้

preset `guardian` จะขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"`
ฟิลด์นโยบายแต่ละตัวสามารถแทนที่ `mode` ได้อยู่แล้ว ดังนั้นการติดตั้งใช้งานขั้นสูงจึงสามารถผสม
preset นี้เข้ากับตัวเลือกแบบ explicit ได้ ค่าผู้ตรวจทาน `guardian_subagent` แบบเก่ายัง
ยอมรับได้ในฐานะ alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้
`auto_review`

สำหรับ app-server ที่กำลังรันอยู่แล้ว ให้ใช้ WebSocket transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์               | ค่าเริ่มต้น                               | ความหมาย                                                                                                         |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` จะสปิน Codex; `"websocket"` จะเชื่อมต่อไปยัง `url`                                                     |
| `command`           | `"codex"`                                 | executable สำหรับ stdio transport                                                                                  |
| `args`              | `["app-server", "--listen", "stdio://"]`  | อาร์กิวเมนต์สำหรับ stdio transport                                                                                |
| `url`               | ไม่ได้ตั้งค่า                              | URL ของ WebSocket app-server                                                                                      |
| `authToken`         | ไม่ได้ตั้งค่า                              | Bearer token สำหรับ WebSocket transport                                                                           |
| `headers`           | `{}`                                      | WebSocket headers เพิ่มเติม                                                                                        |
| `requestTimeoutMs`  | `60000`                                   | ระยะหมดเวลาสำหรับคำขอ control-plane ของ app-server                                                               |
| `mode`              | `"yolo"`                                  | preset สำหรับการรันแบบ YOLO หรือแบบ guardian-reviewed                                                            |
| `approvalPolicy`    | `"never"`                                 | นโยบายการอนุมัติแบบ native ของ Codex ที่ส่งไปยัง thread start/resume/turn                                       |
| `sandbox`           | `"danger-full-access"`                    | โหมด sandbox แบบ native ของ Codex ที่ส่งไปยัง thread start/resume                                                |
| `approvalsReviewer` | `"user"`                                  | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทาน native approval prompts ค่า `guardian_subagent` ยังคงเป็น alias แบบเดิม |
| `serviceTier`       | ไม่ได้ตั้งค่า                              | service tier แบบไม่บังคับของ Codex app-server: `"fast"`, `"flex"` หรือ `null` ค่าเดิมที่ไม่ถูกต้องจะถูกละเลย      |

ตัวแปร environment แบบเก่ายังคงใช้เป็น fallback ได้สำหรับการทดสอบในเครื่องเมื่อ
ฟิลด์ config ที่ตรงกันยังไม่ได้ตั้งค่า:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกถอดออกแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือใช้
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว ควรใช้ config
สำหรับการติดตั้งใช้งานที่ทำซ้ำได้ เพราะจะเก็บพฤติกรรมของ Plugin ไว้ในไฟล์ที่ได้รับการตรวจทานเดียวกันกับส่วนที่เหลือของการตั้งค่า Codex harness

## สูตรใช้งานทั่วไป

Codex ในเครื่องพร้อม stdio transport ค่าเริ่มต้น:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

การตรวจสอบ Codex-only harness:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
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

Codex approvals แบบ guardian-reviewed:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

remote app-server พร้อม headers แบบ explicit:

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
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

การสลับ model ยังคงถูกควบคุมโดย OpenClaw เมื่อเซสชัน OpenClaw ถูกผูกกับ
Codex thread ที่มีอยู่แล้ว เทิร์นถัดไปจะส่ง OpenAI model, provider, approval policy, sandbox และ service tier ที่เลือกอยู่ในปัจจุบันไปยัง
app-server อีกครั้ง การสลับจาก `openai/gpt-5.5` ไปเป็น `openai/gpt-5.2` จะคง
การผูกกับ thread เดิมไว้ แต่ขอให้ Codex ทำงานต่อด้วย model ที่เพิ่งเลือกใหม่

## คำสั่ง Codex

bundled Plugin จะลงทะเบียน `/codex` เป็น slash command สำหรับผู้ใช้ที่ได้รับอนุญาต มัน
เป็นคำสั่งทั่วไปและใช้ได้กับทุกช่องทางที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบสด, models, account, rate limits, MCP servers และ skills
- `/codex models` แสดงรายการ models แบบสดจาก Codex app-server
- `/codex threads [filter]` แสดงรายการ Codex threads ล่าสุด
- `/codex resume <thread-id>` ผูกเซสชัน OpenClaw ปัจจุบันเข้ากับ Codex thread ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server ทำ Compaction ให้กับ thread ที่ผูกอยู่
- `/codex review` เริ่มการตรวจทานแบบ native ของ Codex สำหรับ thread ที่ผูกอยู่
- `/codex account` แสดงสถานะ account และ rate-limit
- `/codex mcp` แสดงสถานะ MCP server ของ Codex app-server
- `/codex skills` แสดง skills ของ Codex app-server

`/codex resume` จะเขียน sidecar binding file แบบเดียวกับที่ harness ใช้สำหรับ
เทิร์นปกติ ในข้อความถัดไป OpenClaw จะกลับไปใช้ Codex thread นั้น ส่ง
OpenAI model ที่เลือกอยู่ในปัจจุบันของ OpenClaw เข้าไปใน app-server และคง
extended history ไว้

พื้นผิวคำสั่งนี้ต้องใช้ Codex app-server `0.118.0` หรือใหม่กว่า methods ควบคุมแต่ละตัวจะถูกรายงานว่าเป็น `unsupported by this Codex app-server` หาก
app-server ในอนาคตหรือแบบกำหนดเองไม่เปิดเผย JSON-RPC method นั้น

## ขอบเขตของ hook

Codex harness มี hook อยู่สามชั้น:

| ชั้น                                 | เจ้าของ                   | วัตถุประสงค์                                                          |
| ------------------------------------ | ------------------------- | --------------------------------------------------------------------- |
| OpenClaw plugin hooks                | OpenClaw                  | ความเข้ากันได้ระดับผลิตภัณฑ์/Plugin ระหว่าง PI และ Codex harnesses   |
| Codex app-server extension middleware | bundled plugins ของ OpenClaw | พฤติกรรมตัวปรับต่อเทิร์นรอบ OpenClaw dynamic tools                    |
| Codex native hooks                   | Codex                     | วงจรชีวิต Codex ระดับล่างและ native tool policy จาก Codex config     |

OpenClaw ไม่ได้ใช้ไฟล์ `hooks.json` ของ Codex ระดับโปรเจกต์หรือโกลบอลในการกำหนดเส้นทาง
พฤติกรรมของ OpenClaw Plugin สำหรับสะพานเชื่อมเครื่องมือและสิทธิ์แบบ native ที่รองรับ
OpenClaw จะ inject Codex config ต่อ thread สำหรับ `PreToolUse`, `PostToolUse` และ
`PermissionRequest` ส่วน Codex hooks อื่น ๆ เช่น `SessionStart`,
`UserPromptSubmit` และ `Stop` ยังคงเป็นตัวควบคุมระดับ Codex; สิ่งเหล่านี้ไม่ถูกเปิดเผย
เป็น OpenClaw plugin hooks ในสัญญา v1

สำหรับ OpenClaw dynamic tools นั้น OpenClaw จะรัน tool หลังจากที่ Codex ขอ
การเรียกใช้ ดังนั้น OpenClaw จึงปล่อยพฤติกรรมของ Plugin และ middleware ที่มันเป็นเจ้าของใน
ตัวปรับของ harness ส่วนสำหรับ Codex-native tools นั้น Codex เป็นเจ้าของระเบียน tool แบบ canonical
OpenClaw สามารถมิเรอร์บางเหตุการณ์ได้ แต่ไม่สามารถเขียน native Codex
thread ใหม่ได้ เว้นแต่ Codex จะเปิดเผยการดำเนินการนั้นผ่าน app-server หรือ native hook
callbacks

การฉายภาพของ Compaction และวงจรชีวิต LLM มาจาก notifications ของ Codex app-server
และสถานะของ OpenClaw adapter ไม่ใช่คำสั่ง native Codex hook
เหตุการณ์ `before_compaction`, `after_compaction`, `llm_input` และ
`llm_output` ของ OpenClaw เป็นการสังเกตการณ์ระดับ adapter ไม่ใช่การจับข้อมูลแบบ byte-for-byte
ของคำขอภายในหรือ payload ของ Compaction ของ Codex

notifications `hook/started` และ `hook/completed` ของ Codex app-server แบบ native จะ
ถูกฉายเป็น agent events `codex_app_server.hook` สำหรับ trajectory และการดีบัก
โดยจะไม่เรียก OpenClaw plugin hooks

## สัญญาการรองรับ v1

โหมด Codex ไม่ใช่ PI ที่แค่เปลี่ยน model call ด้านล่าง Codex เป็นเจ้าของ
native model loop มากกว่าเดิม และ OpenClaw จะปรับพื้นผิวของ Plugin และเซสชัน
รอบขอบเขตนั้น

สิ่งที่รองรับใน Codex runtime v1:

| พื้นผิว                                 | การรองรับ                          | เหตุผล                                                                                                                                       |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI model loop ผ่าน Codex            | รองรับ                              | Codex app-server เป็นเจ้าของ OpenAI turn, native thread resume และ native tool continuation                                                |
| การกำหนดเส้นทางและการส่งของ OpenClaw channel | รองรับ                           | Telegram, Discord, Slack, WhatsApp, iMessage และช่องทางอื่นยังคงอยู่นอก model runtime                                                     |
| OpenClaw dynamic tools                  | รองรับ                              | Codex ขอให้ OpenClaw รัน tools เหล่านี้ ดังนั้น OpenClaw จึงยังอยู่ในเส้นทางการรัน                                                         |
| Prompt และ context plugins              | รองรับ                              | OpenClaw สร้าง prompt overlays และฉาย context เข้าไปใน Codex turn ก่อนเริ่มหรือกลับมาใช้ thread                                           |
| วงจรชีวิตของ context engine             | รองรับ                              | การประกอบ, การ ingest หรือการดูแลหลังเทิร์น และการประสานงาน Compaction ของ context engine จะทำงานกับ Codex turns                         |
| Dynamic tool hooks                      | รองรับ                              | `before_tool_call`, `after_tool_call` และ tool-result middleware ทำงานรอบ OpenClaw-owned dynamic tools                                    |
| Lifecycle hooks                         | รองรับในฐานะการสังเกตระดับ adapter | `llm_input`, `llm_output`, `agent_end`, `before_compaction` และ `after_compaction` จะทำงานพร้อม payload แบบ Codex-mode ที่ตรงตามจริง |
| บล็อกหรือสังเกต native shell และ patch  | รองรับผ่าน native hook relay        | `PreToolUse` และ `PostToolUse` ของ Codex ถูก relay สำหรับพื้นผิว native tool ที่ commit แล้ว รองรับการบล็อก; ไม่รองรับการเขียนอาร์กิวเมนต์ใหม่ |
| Native permission policy                | รองรับผ่าน native hook relay        | `PermissionRequest` ของ Codex สามารถกำหนดเส้นทางผ่านนโยบายของ OpenClaw ได้เมื่อรันไทม์เปิดเผยสิ่งนั้น                                      |
| App-server trajectory capture           | รองรับ                              | OpenClaw จะบันทึกคำขอที่ส่งไปยัง app-server และ notifications ที่ได้รับกลับมา                                                              |

สิ่งที่ไม่รองรับใน Codex runtime v1:

| พื้นผิว                                             | ขอบเขตของ v1                                                                                                                                     | ทิศทางในอนาคต                                                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| การแก้ไขอาร์กิวเมนต์ของ native tool                | native pre-tool hooks ของ Codex สามารถบล็อกได้ แต่ OpenClaw จะไม่เขียนอาร์กิวเมนต์ของ Codex-native tools ใหม่                                  | ต้องอาศัยการรองรับจาก Codex hook/schema สำหรับการแทนที่อินพุตของ tool                                     |
| ประวัติ transcript ของ Codex-native ที่แก้ไขได้      | Codex เป็นเจ้าของ canonical native thread history ส่วน OpenClaw เป็นเจ้าของ mirror และสามารถฉาย context ในอนาคตได้ แต่ไม่ควรแก้ไข internals ที่ไม่รองรับ | เพิ่ม APIs ของ Codex app-server แบบชัดเจนหากจำเป็นต้องผ่าตัด native thread                             |
| `tool_result_persist` สำหรับระเบียน Codex-native tool | hook นี้แปลงการเขียน transcript ที่ OpenClaw เป็นเจ้าของ ไม่ใช่ระเบียนของ Codex-native tool                                                    | อาจมิเรอร์ระเบียนที่แปลงแล้วได้ แต่การเขียน canonical ใหม่ต้องอาศัยการรองรับจาก Codex                   |
| ข้อมูลเมตา Compaction แบบ native ที่ละเอียด         | OpenClaw สังเกตการเริ่มและเสร็จสิ้นของ Compaction ได้ แต่ไม่ได้รับ kept/dropped list, token delta หรือ summary payload ที่เสถียร                 | ต้องการเหตุการณ์ Compaction ของ Codex ที่มีรายละเอียดมากขึ้น                                              |
| การแทรกแซง Compaction                               | ปัจจุบัน hooks ของ OpenClaw สำหรับ Compaction เป็นระดับการแจ้งเตือนในโหมด Codex                                                                  | เพิ่ม Codex pre/post compaction hooks หาก plugins ต้องบล็อกหรือเขียน native compaction ใหม่               |
| การบล็อก stop หรือคำตอบสุดท้าย                      | Codex มี native stop hooks แต่ OpenClaw ยังไม่เปิดเผยการบล็อกคำตอบสุดท้ายเป็นสัญญา Plugin ของ v1                                              | primitive แบบเลือกใช้ในอนาคตพร้อมกลไกป้องกันลูปและ timeout                                              |
| ความเท่าเทียมของ native MCP hook ในฐานะพื้นผิว v1 ที่ยืนยันแล้ว | relay เป็นแบบทั่วไป แต่ OpenClaw ยังไม่ได้ version-gate และทดสอบพฤติกรรม native MCP pre/post hook แบบต้นจนจบ                                  | เพิ่ม tests และเอกสารของ OpenClaw MCP relay เมื่อ protocol floor ของ app-server ที่รองรับครอบคลุม payloads เหล่านั้น |
| การจับคำขอ model API แบบ byte-for-byte              | OpenClaw จับคำขอและ notifications ของ app-server ได้ แต่แกนของ Codex จะสร้างคำขอ OpenAI API ขั้นสุดท้ายภายในเอง                                 | ต้องมีเหตุการณ์ติดตามคำขอ model ของ Codex หรือ debug API                                                 |

## Tools, สื่อ และ Compaction

Codex harness เปลี่ยนเฉพาะตัวรัน embedded agent ระดับล่างเท่านั้น

OpenClaw ยังคงสร้างรายการ tool และรับผลลัพธ์ของ dynamic tool จาก
harness ข้อความ รูปภาพ วิดีโอ เพลง TTS approvals และเอาต์พุตจาก messaging tool
ยังคงผ่านเส้นทางการส่งมอบปกติของ OpenClaw

native hook relay ถูกตั้งใจให้เป็นแบบทั่วไป แต่สัญญาการรองรับ v1
จำกัดอยู่ที่เส้นทาง native tool และสิทธิ์ของ Codex ที่ OpenClaw ทดสอบแล้ว อย่า
สมมติว่า Codex hook event ใด ๆ ในอนาคตจะเป็นพื้นผิวของ OpenClaw Plugin จนกว่า
สัญญาของ runtime จะระบุชื่อมัน

การอนุมัติ elicitation สำหรับ Codex MCP tool จะถูกกำหนดเส้นทางผ่านโฟลว์อนุมัติของ Plugin ใน OpenClaw
เมื่อ Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"` พรอมป์ต `request_user_input` ของ Codex จะถูกส่งกลับไปยัง
แชตต้นทาง และข้อความ follow-up ที่เข้าคิวครั้งถัดไปจะตอบคำขอ native
server นั้น แทนที่จะถูก steer เป็น context เพิ่มเติม ส่วนคำขอ MCP elicitation อื่น ๆ จะยังคง fail closed

เมื่อ model ที่เลือกใช้ Codex harness native thread compaction จะถูก
มอบหมายให้ Codex app-server OpenClaw จะเก็บ transcript mirror ไว้สำหรับ
ประวัติของ channel, การค้นหา, `/new`, `/reset` และการสลับ model หรือ harness ในอนาคต
mirror นี้รวม user prompt, final assistant text และ
ระเบียน reasoning หรือ plan แบบ lightweight ของ Codex เมื่อ app-server ปล่อยออกมา ปัจจุบัน OpenClaw จะบันทึกเฉพาะสัญญาณการเริ่มและการเสร็จสิ้นของ native compaction เท่านั้น
ยังไม่เปิดเผยสรุป Compaction แบบที่มนุษย์อ่านได้ หรือรายการที่ตรวจสอบย้อนหลังได้ว่า Codex
เก็บรายการใดไว้หลัง Compaction

เนื่องจาก Codex เป็นเจ้าของ canonical native thread ตอนนี้ `tool_result_persist` จึงยัง
ไม่เขียนระเบียนผลลัพธ์ของ Codex-native tool ใหม่ มันใช้เฉพาะเมื่อ
OpenClaw กำลังเขียนผลลัพธ์ของ tool ลง session transcript ที่ OpenClaw เป็นเจ้าของ

การสร้างสื่อไม่จำเป็นต้องใช้ PI การสร้างภาพ วิดีโอ เพลง PDF TTS และ media
understanding ยังคงใช้การตั้งค่า provider/model ที่สอดคล้องกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ปัญหา

**Codex ไม่ปรากฏเป็น `/model` provider ปกติ:** นี่เป็นพฤติกรรมที่คาดไว้สำหรับ
config ใหม่ ให้เลือก `openai/gpt-*` model พร้อม
`embeddedHarness.runtime: "codex"` (หรือ `codex/*` ref แบบเดิม) เปิดใช้
`plugins.entries.codex.enabled` และตรวจสอบว่า `plugins.allow` ไม่ได้กีดกัน
`codex`

**OpenClaw ใช้ PI แทน Codex:** `runtime: "auto"` ยังสามารถใช้ PI เป็น
compatibility backend ได้เมื่อไม่มี Codex harness ใดรับช่วงการรัน ตั้งค่า
`embeddedHarness.runtime: "codex"` เพื่อบังคับการเลือก Codex ระหว่างการทดสอบ ตอนนี้
runtime แบบ Codex ที่ถูกบังคับจะล้มเหลวแทนการ fallback ไป PI เว้นแต่คุณจะ
ตั้ง `embeddedHarness.fallback: "pi"` อย่างชัดเจน เมื่อเลือก Codex app-server
แล้ว ความล้มเหลวของมันจะแสดงโดยตรงโดยไม่ต้องมี config fallback เพิ่มเติม

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้ app-server handshake
รายงานเวอร์ชัน `0.118.0` หรือใหม่กว่า

**การค้นหา model ช้า:** ลดค่า `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดการค้นหา

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`
และว่า remote app-server ใช้ Codex app-server protocol version เดียวกัน

**model ที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นพฤติกรรมที่คาดไว้ เว้นแต่คุณจะบังคับ
`embeddedHarness.runtime: "codex"` สำหรับ agent นั้น หรือเลือก
`codex/*` ref แบบเดิม `openai/gpt-*` และ provider refs อื่นแบบปกติจะยังคงใช้
เส้นทาง provider ปกติในโหมด `auto` หากคุณบังคับ `runtime: "codex"` ทุก embedded
turn สำหรับ agent นั้นต้องเป็น OpenAI model ที่ Codex รองรับ

## ที่เกี่ยวข้อง

- [Agent harness plugins](/th/plugins/sdk-agent-harness)
- [Agent runtimes](/th/concepts/agent-runtimes)
- [Model providers](/th/concepts/model-providers)
- [OpenAI provider](/th/providers/openai)
- [Status](/th/cli/status)
- [Plugin hooks](/th/plugins/hooks)
- [Configuration reference](/th/gateway/configuration-reference)
- [Testing](/th/help/testing-live#live-codex-app-server-harness-smoke)
