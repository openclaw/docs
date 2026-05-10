---
read_when:
    - คุณต้องมีฟิลด์การกำหนดค่าของฮาร์เนส Codex ทุกฟิลด์
    - คุณกำลังเปลี่ยนพฤติกรรมด้านการรับส่งข้อมูล การยืนยันตัวตน การค้นพบ หรือการหมดเวลาของเซิร์ฟเวอร์แอป
    - คุณกำลังดีบักการเริ่มต้นฮาร์เนสของ Codex, การค้นหาโมเดล หรือการแยกสภาพแวดล้อม
summary: เอกสารอ้างอิงด้านการกำหนดค่า การยืนยันตัวตน การค้นพบ และเซิร์ฟเวอร์แอปสำหรับฮาร์เนส Codex
title: ข้อมูลอ้างอิงฮาร์เนส Codex
x-i18n:
    generated_at: "2026-05-10T19:45:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงนี้ครอบคลุมการกำหนดค่าโดยละเอียดสำหรับ Plugin `codex`
ที่รวมมาให้ สำหรับการตั้งค่าและการตัดสินใจเรื่องการกำหนดเส้นทาง ให้เริ่มจาก
[ฮาร์เนส Codex](/th/plugins/codex-harness)

## พื้นผิวการกำหนดค่า Plugin

การตั้งค่าฮาร์เนส Codex ทั้งหมดอยู่ภายใต้ `plugins.entries.codex.config`

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

ฟิลด์ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น                  | ความหมาย                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | เปิดใช้งาน                  | การตั้งค่าการค้นหาโมเดลสำหรับ `model/list` ของ app-server ของ Codex                                                                               |
| `appServer`                | app-server แบบ stdio ที่จัดการให้ | การตั้งค่า transport, คำสั่ง, auth, การอนุมัติ, sandbox และ timeout                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | ใช้ `"direct"` เพื่อใส่เครื่องมือไดนามิกของ OpenClaw ลงในบริบทเครื่องมือ Codex เริ่มต้นโดยตรง                                                  |
| `codexDynamicToolsExclude` | `[]`                     | ชื่อเครื่องมือไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากเทิร์นของ app-server ของ Codex                                                               |
| `codexPlugins`             | ปิดใช้งาน                 | การรองรับ Plugin/app แบบเนทีฟของ Codex สำหรับ Plugin curated ที่ติดตั้งจากซอร์สและย้ายมาแล้ว ดู [Plugin แบบเนทีฟของ Codex](/th/plugins/codex-native-plugins) |
| `computerUse`              | ปิดใช้งาน                 | การตั้งค่า Codex Computer Use ดู [Codex Computer Use](/th/plugins/codex-computer-use)                                                          |

## Transport ของ app-server

โดยค่าเริ่มต้น OpenClaw จะเริ่มไบนารี Codex ที่จัดการให้ซึ่งมากับ Plugin
ที่รวมมาให้:

```bash
codex app-server --listen stdio://
```

วิธีนี้ผูกเวอร์ชัน app-server ไว้กับ Plugin `codex` ที่รวมมาให้ แทนที่จะใช้
Codex CLI แยกต่างหากตัวใดก็ตามที่ติดตั้งอยู่ในเครื่อง ตั้งค่า
`appServer.command` เฉพาะเมื่อคุณตั้งใจจะเรียกใช้ executable อื่นเท่านั้น

สำหรับ app-server ที่กำลังทำงานอยู่แล้ว ให้ใช้ transport แบบ WebSocket:

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` สร้างโปรเซส Codex; `"websocket"` เชื่อมต่อไปยัง `url`                                                                                                                                        |
| `command`                     | ไบนารี Codex ที่จัดการให้                                   | Executable สำหรับ transport แบบ stdio เว้นว่างไว้เพื่อใช้ไบนารีที่จัดการให้                                                                                                                          |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับ transport แบบ stdio                                                                                                                                                                  |
| `url`                         | ไม่ได้ตั้งค่า                                                  | URL ของ app-server แบบ WebSocket                                                                                                                                                                       |
| `authToken`                   | ไม่ได้ตั้งค่า                                                  | Bearer token สำหรับ transport แบบ WebSocket                                                                                                                                                           |
| `headers`                     | `{}`                                                   | header ของ WebSocket เพิ่มเติม                                                                                                                                                                        |
| `clearEnv`                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากโปรเซส app-server แบบ stdio ที่ถูกสร้าง หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมา                                                             |
| `requestTimeoutMs`            | `60000`                                                | timeout สำหรับการเรียก control-plane ของ app-server                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | หน้าต่างเงียบหลังคำขอ app-server ที่ผูกกับเทิร์น ขณะที่ OpenClaw รอ `turn/completed`                                                                                                  |
| `mode`                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ในเครื่องไม่อนุญาต YOLO | preset สำหรับการทำงานแบบ YOLO หรือแบบมี guardian ตรวจทาน                                                                                                                                                 |
| `approvalPolicy`              | `"never"` หรือนโยบายการอนุมัติของ guardian ที่อนุญาต       | นโยบายการอนุมัติแบบเนทีฟของ Codex ที่ส่งไปยังการเริ่ม thread, การ resume และเทิร์น                                                                                                                            |
| `sandbox`                     | `"danger-full-access"` หรือ sandbox ของ guardian ที่อนุญาต  | โหมด sandbox แบบเนทีฟของ Codex ที่ส่งไปยังการเริ่ม thread และ resume                                                                                                                                      |
| `approvalsReviewer`           | `"user"` หรือ reviewer ของ guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทาน prompt การอนุมัติแบบเนทีฟเมื่ออนุญาต                                                                                                                   |
| `defaultWorkspaceDir`         | ไดเรกทอรีของโปรเซสปัจจุบัน                              | workspace ที่ `/codex bind` ใช้เมื่อไม่ได้ระบุ `--cwd`                                                                                                                                        |
| `serviceTier`                 | ไม่ได้ตั้งค่า                                                  | service tier ของ app-server ของ Codex แบบไม่บังคับ `"priority"` เปิดใช้งานการกำหนดเส้นทาง fast-mode, `"flex"` ขอการประมวลผลแบบ flex และ `null` ล้าง override ค่าเดิม `"fast"` ยังคงยอมรับเป็น `"priority"` |

Plugin จะบล็อก handshake ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน Codex app-server
ต้องรายงานเวอร์ชันเสถียร `0.125.0` หรือใหม่กว่า

## โหมดการอนุมัติและ sandbox

เซสชัน app-server แบบ stdio ในเครื่องมีค่าเริ่มต้นเป็นโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` ท่าทีแบบผู้ปฏิบัติการในเครื่องที่เชื่อถือได้นี้ทำให้
เทิร์นและ Heartbeat ของ OpenClaw ที่ไม่มีคนเฝ้าสามารถคืบหน้าได้โดยไม่มี prompt
การอนุมัติแบบเนทีฟที่ไม่มีใครอยู่เพื่อตอบ

หากไฟล์ข้อกำหนดระบบในเครื่องของ Codex ไม่อนุญาตค่า approval, reviewer หรือ sandbox
แบบ YOLO โดยนัย OpenClaw จะถือค่าเริ่มต้นโดยนัยนั้นเป็น guardian แทน
และเลือกสิทธิ์ guardian ที่อนุญาต รายการ `[[remote_sandbox_config]]`
ที่ตรงกับ hostname ในไฟล์ข้อกำหนดเดียวกันจะถูกใช้ในการตัดสินใจค่าเริ่มต้นของ sandbox

ตั้งค่า `appServer.mode: "guardian"` สำหรับการอนุมัติ Codex แบบมี guardian ตรวจทาน:

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

preset `guardian` ขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"` เมื่อค่าเหล่านั้น
ได้รับอนุญาต ฟิลด์นโยบายแต่ละรายการ override `mode` ค่า reviewer แบบเก่า
`guardian_subagent` ยังยอมรับเป็น alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้
`auto_review`

## Auth และการแยกสภาพแวดล้อม

Auth ถูกเลือกตามลำดับนี้:

1. โปรไฟล์ auth Codex ของ OpenClaw แบบชัดเจนสำหรับ agent
2. บัญชีที่มีอยู่ของ app-server ใน Codex home ของ agent นั้น
3. สำหรับการเปิด app-server แบบ stdio ในเครื่องเท่านั้น `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้ OpenAI auth

เมื่อ OpenClaw พบโปรไฟล์ auth Codex แบบการสมัครใช้งาน ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากโปรเซสลูก Codex ที่ถูกสร้าง วิธีนี้
ทำให้คีย์ API ระดับ Gateway ยังพร้อมใช้งานสำหรับ embeddings หรือโมเดล OpenAI โดยตรง
โดยไม่ทำให้เทิร์น app-server แบบเนทีฟของ Codex ถูกคิดเงินผ่าน API โดยไม่ตั้งใจ

โปรไฟล์ API-key ของ Codex แบบชัดเจนและ fallback env-key ของ stdio ในเครื่องใช้การ login
ของ app-server แทน env ที่สืบทอดจากโปรเซสลูก การเชื่อมต่อ app-server แบบ WebSocket
จะไม่ได้รับ fallback API-key จาก env ของ Gateway; ให้ใช้โปรไฟล์ auth แบบชัดเจน
หรือบัญชีของ app-server ระยะไกลเอง

การเปิด app-server แบบ stdio สืบทอดสภาพแวดล้อมของโปรเซส OpenClaw โดยค่าเริ่มต้น แต่
OpenClaw เป็นเจ้าของ bridge บัญชี app-server ของ Codex และตั้งทั้ง `CODEX_HOME` และ
`HOME` เป็นไดเรกทอรีต่อ agent ภายใต้สถานะ OpenClaw ของ agent นั้น ตัวโหลด skill ของ Codex
เองอ่าน `$CODEX_HOME/skills` และ `$HOME/.agents/skills` ดังนั้นค่าทั้งสอง
จึงถูกแยกสำหรับการเปิด app-server ในเครื่อง วิธีนี้ทำให้ skills, Plugin, config,
บัญชี และสถานะ thread แบบเนทีฟของ Codex ถูกจำกัดขอบเขตไว้กับ agent ของ OpenClaw
แทนที่จะรั่วเข้ามาจาก Codex CLI home ส่วนตัวของผู้ปฏิบัติการ

Plugin ของ OpenClaw และ snapshot skill ของ OpenClaw ยังคงไหลผ่าน registry Plugin และ
ตัวโหลด skill ของ OpenClaw เอง asset ส่วนตัวของ Codex CLI จะไม่ไหลผ่าน หากคุณมี
skills หรือ Plugin ของ Codex CLI ที่มีประโยชน์และควรเป็นส่วนหนึ่งของ agent ของ OpenClaw
ให้ทำ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` มีผลเฉพาะกับโปรเซสลูก app-server ของ Codex ที่ถูกสร้างเท่านั้น
`CODEX_HOME` และ `HOME` ยังคงถูกสงวนไว้สำหรับการแยก Codex ต่อ agent ของ OpenClaw
ในการเปิดใช้งานในเครื่อง

## เครื่องมือไดนามิก

เครื่องมือไดนามิกของ Codex มีค่าเริ่มต้นเป็นการโหลดแบบ `searchable` OpenClaw ไม่เปิดเผย
เครื่องมือไดนามิกที่ซ้ำกับการทำงาน workspace แบบเนทีฟของ Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

เครื่องมือการผสานรวม OpenClaw ที่เหลือ เช่น การรับส่งข้อความ, เซสชัน, สื่อ, Cron,
เบราว์เซอร์, โหนด, Gateway, `heartbeat_respond` และ `web_search` พร้อมใช้งาน
ผ่านการค้นหาเครื่องมือของ Codex ภายใต้เนมสเปซ `openclaw` วิธีนี้ช่วยให้บริบท
โมเดลเริ่มต้นเล็กลง `sessions_yield` และการตอบกลับแหล่งที่มาที่ใช้เฉพาะเครื่องมือข้อความ
ยังคงเป็นแบบโดยตรง เพราะสิ่งเหล่านั้นเป็นสัญญาควบคุมเทิร์น

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับเซิร์ฟเวอร์แอป Codex
แบบกำหนดเองที่ไม่สามารถค้นหาเครื่องมือไดนามิกที่เลื่อนไว้ได้ หรือเมื่อดีบักเพย์โหลด
เครื่องมือแบบเต็ม

## การหมดเวลา

การเรียกเครื่องมือไดนามิกที่ OpenClaw เป็นเจ้าของจะถูกจำกัดเวลาแยกต่างหากจาก
`appServer.requestTimeoutMs` คำขอ `item/tool/call` ของ Codex แต่ละรายการใช้
ค่าหมดเวลาแรกที่มีอยู่ตามลำดับนี้:

- อาร์กิวเมนต์ `timeoutMs` ต่อการเรียกที่มีค่าเป็นบวก
- สำหรับ `image_generate` ให้ใช้ `agents.defaults.imageGenerationModel.timeoutMs`
- สำหรับเครื่องมือ `image` สำหรับทำความเข้าใจสื่อ ให้ใช้ `tools.media.image.timeoutSeconds`
  ที่แปลงเป็นมิลลิวินาที หรือค่าเริ่มต้นสื่อ 60 วินาที
- ค่าเริ่มต้นเครื่องมือไดนามิก 30 วินาที

งบเวลาเครื่องมือไดนามิกถูกจำกัดสูงสุดที่ 600000 ms เมื่อหมดเวลา OpenClaw จะยกเลิก
สัญญาณเครื่องมือเมื่อรองรับ และส่งคืนการตอบกลับเครื่องมือไดนามิกที่ล้มเหลวไปยัง Codex
เพื่อให้เทิร์นดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันค้างอยู่ในสถานะ `processing`

หลังจาก OpenClaw ตอบกลับคำขอเซิร์ฟเวอร์แอปที่อยู่ในขอบเขตเทิร์นของ Codex แล้ว harness
ยังคาดหวังให้ Codex จบเทิร์นเนทีฟด้วย `turn/completed` ด้วย หากเซิร์ฟเวอร์แอปเงียบไปเป็นเวลา
`appServer.turnCompletionIdleTimeoutMs` หลังจากการตอบกลับนั้น OpenClaw จะพยายามขัดจังหวะ
เทิร์น Codex อย่างดีที่สุด บันทึกการวินิจฉัยการหมดเวลา และปล่อยช่องทางเซสชัน OpenClaw
เพื่อให้ข้อความแชตติดตามผลไม่ถูกเข้าคิวไว้หลังเทิร์นเนทีฟที่ค้างอยู่

การแจ้งเตือนที่ยังไม่สิ้นสุดใด ๆ สำหรับเทิร์นเดียวกัน รวมถึง
`rawResponseItem/completed` จะปลดตัวเฝ้าระวังระยะสั้นนั้น เพราะ Codex ได้พิสูจน์แล้วว่า
เทิร์นนั้นยังมีชีวิตอยู่ ตัวเฝ้าระวังปลายทางที่ยาวกว่ายังคงป้องกันเทิร์นที่ค้างจริง ๆ
การวินิจฉัยการหมดเวลารวมถึงเมธอดการแจ้งเตือนล่าสุดจากเซิร์ฟเวอร์แอป และสำหรับรายการ
การตอบกลับดิบของผู้ช่วย จะรวมประเภทของรายการ บทบาท id และตัวอย่างข้อความผู้ช่วย
ที่มีขอบเขตจำกัด

## การค้นพบโมเดล

โดยค่าเริ่มต้น Plugin Codex จะขอโมเดลที่พร้อมใช้งานจากเซิร์ฟเวอร์แอป ความพร้อมใช้งานของโมเดล
เป็นของเซิร์ฟเวอร์แอป Codex ดังนั้นรายการอาจเปลี่ยนเมื่อ OpenClaw อัปเกรดเวอร์ชัน
`@openai/codex` ที่รวมมา หรือเมื่อการปรับใช้ชี้ `appServer.command` ไปยังไบนารี Codex
อื่น ความพร้อมใช้งานอาจขึ้นกับบัญชีได้เช่นกัน ใช้ `/codex models` บน Gateway ที่กำลังทำงาน
เพื่อดูแค็ตตาล็อกสดสำหรับ harness และบัญชีนั้น

หากการค้นพบล้มเหลวหรือหมดเวลา OpenClaw จะใช้แค็ตตาล็อกสำรองที่รวมมา สำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

harness ที่รวมมาปัจจุบันคือ `@openai/codex` `0.130.0` การตรวจสอบ `model/list`
กับเซิร์ฟเวอร์แอปที่รวมมานั้นส่งคืน:

| id โมเดล              | ค่าเริ่มต้น | ซ่อนอยู่ | รูปแบบอินพุต | ระดับความพยายามในการให้เหตุผล |
| --------------------- | ----------- | -------- | ------------ | ------------------------------- |
| `gpt-5.5`             | ใช่         | ไม่      | ข้อความ, รูปภาพ | low, medium, high, xhigh |
| `gpt-5.4`             | ไม่         | ไม่      | ข้อความ, รูปภาพ | low, medium, high, xhigh |
| `gpt-5.4-mini`        | ไม่         | ไม่      | ข้อความ, รูปภาพ | low, medium, high, xhigh |
| `gpt-5.3-codex`       | ไม่         | ไม่      | ข้อความ, รูปภาพ | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | ไม่         | ไม่      | ข้อความ       | low, medium, high, xhigh |
| `gpt-5.2`             | ไม่         | ไม่      | ข้อความ, รูปภาพ | low, medium, high, xhigh |

โมเดลที่ซ่อนอยู่สามารถถูกส่งคืนโดยแค็ตตาล็อกเซิร์ฟเวอร์แอปสำหรับโฟลว์ภายในหรือ
เฉพาะทาง แต่ไม่ใช่ตัวเลือกปกติในตัวเลือกโมเดล

ปรับแต่งการค้นพบภายใต้ `plugins.entries.codex.config.discovery`:

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

ปิดใช้งานการค้นพบเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการตรวจสอบ Codex และใช้เฉพาะ
แค็ตตาล็อกสำรอง:

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

## ไฟล์บูตสแตรปของเวิร์กสเปซ

Codex จัดการ `AGENTS.md` เองผ่านการค้นพบเอกสารโปรเจกต์แบบเนทีฟ OpenClaw
ไม่เขียนไฟล์เอกสารโปรเจกต์ Codex สังเคราะห์ หรือพึ่งพาชื่อไฟล์สำรองของ Codex
สำหรับไฟล์ persona เพราะ fallback ของ Codex จะมีผลเฉพาะเมื่อไม่มี `AGENTS.md`

เพื่อให้เวิร์กสเปซ OpenClaw เทียบเท่ากัน harness ของ Codex จะ resolve ไฟล์บูตสแตรปอื่น ๆ
รวมถึง `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md` และ `MEMORY.md` เมื่อมีอยู่ และส่งต่อไฟล์เหล่านั้น
ผ่านคำสั่งนักพัฒนาของ Codex บน `thread/start` และ `thread/resume`
วิธีนี้ทำให้บริบท persona และโปรไฟล์ของเวิร์กสเปซมองเห็นได้บนช่องทางการกำหนดพฤติกรรม
Codex แบบเนทีฟ โดยไม่ทำซ้ำ `AGENTS.md`

## การแทนที่ผ่านสภาพแวดล้อม

การแทนที่ผ่านสภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบภายในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่มีการจัดการเมื่อ
`appServer.command` ไม่ได้ตั้งค่า

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกนำออกแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบภายในเครื่องแบบครั้งเดียว
แนะนำให้ใช้ config สำหรับการปรับใช้ที่ทำซ้ำได้ เพราะจะเก็บพฤติกรรมของ Plugin ไว้ในไฟล์
ที่ผ่านการตรวจทานเดียวกันกับการตั้งค่า harness ของ Codex ส่วนที่เหลือ

## ที่เกี่ยวข้อง

- [harness ของ Codex](/th/plugins/codex-harness)
- [รันไทม์ harness ของ Codex](/th/plugins/codex-harness-runtime)
- [Plugin Codex แบบเนทีฟ](/th/plugins/codex-native-plugins)
- [การใช้คอมพิวเตอร์ของ Codex](/th/plugins/codex-computer-use)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
