---
read_when:
    - คุณต้องการใช้แอป-server harness ของ Codex ที่มาพร้อมกัน
    - คุณต้องการการอ้างอิงโมเดล Codex และตัวอย่างการตั้งค่า
    - คุณต้องการปิดการ fallback ของ Pi สำหรับ deployment ที่ใช้ Codex เท่านั้น
summary: รันเทิร์นเอเจนต์แบบ embedded ของ OpenClaw ผ่านแอป-server harness ของ Codex ที่มาพร้อมกัน
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T10:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Plugin `codex` ที่มาพร้อมกันช่วยให้ OpenClaw รันเทิร์นเอเจนต์แบบ embedded ผ่าน
Codex app-server แทนที่จะใช้ PI harness ที่มีมาในตัว

ใช้สิ่งนี้เมื่อคุณต้องการให้ Codex เป็นผู้ดูแลเซสชันเอเจนต์ในระดับล่าง: การค้นหาโมเดล
การ resume เธรดแบบ native, Compaction แบบ native และการทำงานผ่าน app-server
OpenClaw ยังคงดูแลช่องทางแชต ไฟล์เซสชัน การเลือกโมเดล เครื่องมือ
การอนุมัติ การส่งสื่อ และ transcript mirror ที่มองเห็นได้

เทิร์นแบบ native ของ Codex ยังเคารพ hook ของ Plugin ที่ใช้ร่วมกัน ดังนั้น prompt shim,
ระบบอัตโนมัติที่รับรู้ Compaction, middleware ของเครื่องมือ และ lifecycle observer
จะยังสอดคล้องกับ PI harness:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Plugin แบบ bundled ยังสามารถลงทะเบียน extension factory ของ Codex app-server เพื่อเพิ่ม
middleware `tool_result` แบบ async ได้

Harness นี้ปิดไว้เป็นค่าเริ่มต้น โดยจะถูกเลือกใช้เฉพาะเมื่อเปิดใช้ Plugin `codex`
และโมเดลที่ resolve แล้วเป็นโมเดล `codex/*` หรือเมื่อคุณบังคับอย่างชัดเจนด้วย
`embeddedHarness.runtime: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`
หากคุณไม่เคยตั้งค่า `codex/*` การรันแบบ PI, OpenAI, Anthropic, Gemini, local
และ custom-provider ที่มีอยู่จะยังคงพฤติกรรมเดิม

## เลือกคำนำหน้าโมเดลให้ถูกต้อง

OpenClaw มีเส้นทางแยกกันสำหรับการเข้าถึงแบบ OpenAI และแบบ Codex:

| การอ้างอิงโมเดล       | เส้นทางรันไทม์                              | ใช้เมื่อ                                                                  |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`       | OpenAI provider ผ่าน plumbing ของ OpenClaw/PI | คุณต้องการเข้าถึง OpenAI Platform API โดยตรงด้วย `OPENAI_API_KEY`       |
| `openai-codex/gpt-5.4` | OpenAI Codex OAuth provider ผ่าน PI          | คุณต้องการ ChatGPT/Codex OAuth โดยไม่ใช้ Codex app-server harness        |
| `codex/gpt-5.4`        | Codex provider แบบ bundled พร้อม Codex harness | คุณต้องการการทำงานแบบ native ของ Codex app-server สำหรับเทิร์นเอเจนต์แบบ embedded |

Codex harness จะรับเฉพาะการอ้างอิงโมเดล `codex/*` เท่านั้น การอ้างอิงแบบ `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local และ custom provider ที่มีอยู่จะยังคง
ใช้เส้นทางตามปกติ

## ข้อกำหนด

- OpenClaw ที่มี Plugin `codex` แบบ bundled พร้อมใช้งาน
- Codex app-server เวอร์ชัน `0.118.0` หรือใหม่กว่า
- app-server process ต้องเข้าถึง auth ของ Codex ได้

Plugin จะบล็อกการจับมือกับ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน
เพื่อให้ OpenClaw ใช้งานบนพื้นผิวโปรโตคอลที่ผ่านการทดสอบแล้ว

สำหรับ live test และ Docker smoke test โดยทั่วไป auth จะมาจาก `OPENAI_API_KEY` ร่วมกับ
ไฟล์ Codex CLI แบบไม่บังคับ เช่น `~/.codex/auth.json` และ
`~/.codex/config.toml` ให้ใช้ข้อมูล auth ชุดเดียวกับที่ Codex app-server ในเครื่องของคุณใช้

## คอนฟิกขั้นต่ำ

ใช้ `codex/gpt-5.4`, เปิดใช้ Plugin แบบ bundled และบังคับใช้ harness `codex`:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

หากคอนฟิกของคุณใช้ `plugins.allow` ให้รวม `codex` ไว้ที่นั่นด้วย:

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

การตั้งค่า `agents.defaults.model` หรือโมเดลของเอเจนต์เป็น `codex/<model>` ก็จะ
เปิดใช้ Plugin `codex` แบบ bundled ให้อัตโนมัติเช่นกัน รายการ Plugin แบบ explicit ยังมีประโยชน์
ในคอนฟิกร่วมกัน เพราะช่วยให้เจตนาของ deployment ชัดเจน

## เพิ่ม Codex โดยไม่แทนที่โมเดลอื่น

คง `runtime: "auto"` ไว้เมื่อคุณต้องการใช้ Codex สำหรับโมเดล `codex/*` และใช้ PI สำหรับ
อย่างอื่นทั้งหมด:

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
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

ด้วยรูปแบบนี้:

- `/model codex` หรือ `/model codex/gpt-5.4` จะใช้ Codex app-server harness
- `/model gpt` หรือ `/model openai/gpt-5.4` จะใช้เส้นทาง OpenAI provider
- `/model opus` จะใช้เส้นทาง Anthropic provider
- หากเลือกโมเดลที่ไม่ใช่ Codex, PI จะยังคงเป็น compatibility harness

## deployment ที่ใช้ Codex เท่านั้น

ปิดการ fallback ไปยัง Pi เมื่อต้องการพิสูจน์ว่าเทิร์นเอเจนต์แบบ embedded ทุกครั้งใช้
Codex harness:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

การ override ผ่านสภาพแวดล้อม:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

เมื่อปิด fallback, OpenClaw จะล้มเหลวตั้งแต่เนิ่น ๆ หากปิด Plugin Codex อยู่
โมเดลที่ร้องขอไม่ใช่การอ้างอิง `codex/*`, app-server เก่าเกินไป หรือ
app-server ไม่สามารถเริ่มต้นได้

## Codex รายเอเจนต์

คุณสามารถทำให้เอเจนต์หนึ่งตัวเป็น Codex-only ในขณะที่เอเจนต์เริ่มต้นยังคงใช้
การเลือกอัตโนมัติตามปกติได้:

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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

ใช้คำสั่งเซสชันตามปกติเพื่อสลับเอเจนต์และโมเดล `/new` จะสร้าง
เซสชัน OpenClaw ใหม่ และ Codex harness จะสร้างหรือ resume sidecar app-server
thread ตามต้องการ `/reset` จะล้างการผูกเซสชัน OpenClaw สำหรับเธรดนั้น

## การค้นหาโมเดล

โดยค่าเริ่มต้น Plugin Codex จะถาม app-server ว่ามีโมเดลใดใช้งานได้บ้าง หาก
การค้นหาล้มเหลวหรือหมดเวลา ระบบจะใช้แค็ตตาล็อก fallback ที่มาพร้อมกัน:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

ปิดการค้นหาเมื่อต้องการให้การเริ่มต้นระบบหลีกเลี่ยงการ probe Codex และยึดตาม
แค็ตตาล็อก fallback:

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

โดยค่าเริ่มต้น OpenClaw จะเริ่มเซสชัน Codex harness ในเครื่องในโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` นี่คือท่าทีของผู้ปฏิบัติงานในเครื่องที่เชื่อถือได้ซึ่งใช้
สำหรับ Heartbeat แบบอัตโนมัติ: Codex สามารถใช้ shell และเครื่องมือเครือข่ายได้โดยไม่หยุด
รอพรอมป์อนุมัติแบบ native ที่ไม่มีใครอยู่ตอบ

หากต้องการ opt in เข้าสู่การอนุมัติที่มีการตรวจทานโดย Guardian ของ Codex ให้ตั้ง `appServer.mode:
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

โหมด Guardian จะขยายเป็น:

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Guardian คือผู้ตรวจทานการอนุมัติแบบ native ของ Codex เมื่อ Codex ขอออกจาก
sandbox, เขียนนอก workspace หรือเพิ่มสิทธิ์ เช่น การเข้าถึงเครือข่าย
Codex จะกำหนดเส้นทางคำขออนุมัตินั้นไปยัง reviewer subagent แทนพรอมป์ถึงมนุษย์
reviewer จะรวบรวมบริบทและใช้กรอบความเสี่ยงของ Codex จากนั้น
อนุมัติหรือปฏิเสธคำขอเฉพาะนั้น Guardian มีประโยชน์เมื่อคุณต้องการ guardrail มากกว่า
โหมด YOLO แต่ยังต้องการให้เอเจนต์และ Heartbeat แบบไม่มีผู้ดูแลยังคงทำงานต่อได้

live harness แบบ Docker มี Guardian probe เมื่อ
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1` โดยจะเริ่ม Codex harness ใน
โหมด Guardian ตรวจสอบว่าคำสั่ง shell แบบยกระดับที่ไม่เป็นอันตรายได้รับการอนุมัติ และ
ตรวจสอบว่าการอัปโหลด secret ปลอมไปยังปลายทางภายนอกที่ไม่น่าเชื่อถือถูกปฏิเสธ
เพื่อให้เอเจนต์ย้อนกลับมาขอการอนุมัติอย่างชัดเจน

ฟิลด์นโยบายแต่ละตัวจะยังคงมีความสำคัญมากกว่า `mode` ดังนั้น deployment ขั้นสูงสามารถ
ผสม preset นี้กับตัวเลือกแบบ explicit ได้

สำหรับ app-server ที่รันอยู่แล้ว ให้ใช้ transport แบบ WebSocket:

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

| ฟิลด์              | ค่าเริ่มต้น                               | ความหมาย                                                                                                      |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `transport`        | `"stdio"`                                | `"stdio"` จะ spawn Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                 |
| `command`          | `"codex"`                                | executable สำหรับ transport แบบ stdio                                                                         |
| `args`             | `["app-server", "--listen", "stdio://"]` | อาร์กิวเมนต์สำหรับ transport แบบ stdio                                                                       |
| `url`              | ไม่ได้ตั้งค่า                             | URL ของ WebSocket app-server                                                                                  |
| `authToken`        | ไม่ได้ตั้งค่า                             | Bearer token สำหรับ transport แบบ WebSocket                                                                   |
| `headers`          | `{}`                                     | header เพิ่มเติมสำหรับ WebSocket                                                                               |
| `requestTimeoutMs` | `60000`                                  | timeout สำหรับการเรียก control-plane ของ app-server                                                           |
| `mode`             | `"yolo"`                                 | preset สำหรับการทำงานแบบ YOLO หรือแบบมีการตรวจทานโดย Guardian                                                |
| `approvalPolicy`   | `"never"`                                | นโยบายการอนุมัติแบบ native ของ Codex ที่ส่งไปตอนเริ่ม/ resume เธรด/เทิร์น                                     |
| `sandbox`          | `"danger-full-access"`                   | โหมด sandbox แบบ native ของ Codex ที่ส่งไปตอนเริ่ม/ resume เธรด                                               |
| `approvalsReviewer`| `"user"`                                 | ใช้ `"guardian_subagent"` เพื่อให้ Codex Guardian ตรวจทานพรอมป์                                              |
| `serviceTier`      | ไม่ได้ตั้งค่า                             | service tier ของ Codex app-server แบบไม่บังคับ: `"fast"`, `"flex"` หรือ `null` ค่า legacy ที่ไม่ถูกต้องจะถูกละเว้น |

ตัวแปรสภาพแวดล้อมรุ่นเก่ายังคงทำงานเป็น fallback สำหรับการทดสอบในเครื่องเมื่อ
ฟิลด์คอนฟิกที่ตรงกันยังไม่ได้ตั้งค่า:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกถอดออกแล้ว ให้ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือใช้
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบเฉพาะครั้งในเครื่อง คอนฟิก
เป็นวิธีที่แนะนำสำหรับ deployment ที่ทำซ้ำได้ เพราะทำให้พฤติกรรมของ Plugin อยู่ใน
ไฟล์ที่ผ่านการตรวจทานเดียวกันกับการตั้งค่า Codex harness ส่วนที่เหลือ

## สูตรที่ใช้บ่อย

Codex ในเครื่องพร้อม stdio transport แบบค่าเริ่มต้น:

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

การตรวจสอบ Codex-only harness โดยปิด PI fallback:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

การอนุมัติ Codex ที่มีการตรวจทานโดย Guardian:

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

app-server ระยะไกลพร้อม header แบบ explicit:

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

การสลับโมเดลยังคงถูกควบคุมโดย OpenClaw เมื่อเซสชัน OpenClaw ถูกผูกอยู่กับ
เธรด Codex ที่มีอยู่ เทิร์นถัดไปจะส่งโมเดล `codex/*`, provider,
approval policy, sandbox และ service tier ที่เลือกอยู่ในปัจจุบันไปยัง
app-server อีกครั้ง การสลับจาก `codex/gpt-5.4` เป็น `codex/gpt-5.2` จะยังคง
การผูกเธรดไว้ แต่จะขอให้ Codex ดำเนินต่อด้วยโมเดลที่เลือกใหม่

## คำสั่ง Codex

Plugin แบบ bundled จะลงทะเบียน `/codex` เป็น slash command ที่ได้รับอนุญาต โดยเป็นคำสั่ง
ทั่วไปและใช้งานได้กับทุกช่องทางที่รองรับคำสั่งข้อความของ OpenClaw

รูปแบบที่ใช้บ่อย:

- `/codex status` แสดงการเชื่อมต่อ app-server แบบ live, โมเดล, บัญชี, rate limit, เซิร์ฟเวอร์ MCP และ Skills
- `/codex models` แสดงรายการโมเดลของ Codex app-server แบบ live
- `/codex threads [filter]` แสดงรายการเธรด Codex ล่าสุด
- `/codex resume <thread-id>` ผูกเซสชัน OpenClaw ปัจจุบันเข้ากับเธรด Codex ที่มีอยู่
- `/codex compact` ขอให้ Codex app-server ทำ Compaction กับเธรดที่ผูกอยู่
- `/codex review` เริ่มการ review แบบ native ของ Codex สำหรับเธรดที่ผูกอยู่
- `/codex account` แสดงสถานะบัญชีและ rate limit
- `/codex mcp` แสดงสถานะเซิร์ฟเวอร์ MCP ของ Codex app-server
- `/codex skills` แสดง Skills ของ Codex app-server

`/codex resume` จะเขียนไฟล์ sidecar binding เดียวกับที่ harness ใช้สำหรับ
เทิร์นปกติ ในข้อความถัดไป OpenClaw จะ resume เธรด Codex นั้น ส่ง
โมเดล `codex/*` ของ OpenClaw ที่เลือกอยู่ในขณะนั้นเข้าไปยัง app-server และคง
extended history ไว้

พื้นผิวของคำสั่งนี้ต้องใช้ Codex app-server เวอร์ชัน `0.118.0` หรือใหม่กว่า เมธอดควบคุมแต่ละรายการ
จะถูกรายงานเป็น `unsupported by this Codex app-server` หาก
app-server ในอนาคตหรือแบบกำหนดเองไม่ได้เปิดเผย JSON-RPC method นั้น

## เครื่องมือ สื่อ และ Compaction

Codex harness จะเปลี่ยนเฉพาะ executor ของเอเจนต์แบบ embedded ระดับล่างเท่านั้น

OpenClaw ยังคงสร้างรายการเครื่องมือและรับผลลัพธ์เครื่องมือแบบ dynamic จาก
harness ข้อความ รูปภาพ วิดีโอ เพลง TTS การอนุมัติ และผลลัพธ์จากเครื่องมือส่งข้อความ
ยังคงผ่านเส้นทางการส่งมอบปกติของ OpenClaw

การขออนุมัติ MCP tool ของ Codex จะถูกกำหนดเส้นทางผ่าน flow การอนุมัติของ Plugin ใน OpenClaw เมื่อ
Codex ทำเครื่องหมาย `_meta.codex_approval_kind` เป็น
`"mcp_tool_call"`; ส่วนการขอ input แบบ elicitation อื่น ๆ และแบบ free-form จะยังคง
ล้มเหลวแบบ fail-closed

เมื่อโมเดลที่เลือกใช้ Codex harness, Compaction ของเธรดแบบ native จะถูก
มอบหมายให้ Codex app-server จัดการ OpenClaw ยังคงเก็บ transcript mirror ไว้สำหรับ
ประวัติช่องทาง การค้นหา `/new`, `/reset` และการสลับโมเดลหรือ harness ในอนาคต
mirror นี้รวมพรอมป์ของผู้ใช้ ข้อความสุดท้ายของผู้ช่วย และบันทึก reasoning หรือ plan
แบบเบาของ Codex เมื่อ app-server ส่งข้อมูลดังกล่าวออกมา ปัจจุบัน OpenClaw จะบันทึกเฉพาะ
สัญญาณเริ่มต้นและเสร็จสิ้นของ Compaction แบบ native เท่านั้น ยังไม่ได้เปิดเผย
สรุป Compaction ที่มนุษย์อ่านได้ หรือรายการที่ตรวจสอบย้อนหลังได้ว่า Codex
เก็บรายการใดไว้หลังการทำ Compaction

การสร้างสื่อไม่จำเป็นต้องใช้ Pi การสร้างภาพ วิดีโอ เพลง PDF, TTS และ
ความเข้าใจสื่อยังคงใช้การตั้งค่า provider/โมเดลที่ตรงกัน เช่น
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` และ
`messages.tts`

## การแก้ไขปัญหา

**Codex ไม่ปรากฏใน `/model`:** เปิดใช้ `plugins.entries.codex.enabled`,
ตั้งค่าการอ้างอิงโมเดล `codex/*` หรือตรวจสอบว่า `plugins.allow` กัน `codex` ไว้หรือไม่

**OpenClaw ใช้ PI แทน Codex:** หากไม่มี Codex harness ใดรับช่วงการรันนั้น,
OpenClaw อาจใช้ PI เป็นแบ็กเอนด์เพื่อความเข้ากันได้ ให้ตั้ง
`embeddedHarness.runtime: "codex"` เพื่อบังคับเลือก Codex ระหว่างการทดสอบ หรือ
`embeddedHarness.fallback: "none"` เพื่อให้ล้มเหลวเมื่อไม่มี Plugin harness ที่ตรงกัน เมื่อ
เลือก Codex app-server แล้ว ความล้มเหลวของมันจะแสดงออกมาโดยตรงโดยไม่ต้องมี
คอนฟิก fallback เพิ่มเติม

**app-server ถูกปฏิเสธ:** อัปเกรด Codex เพื่อให้การจับมือของ app-server
รายงานเวอร์ชัน `0.118.0` หรือใหม่กว่า

**การค้นหาโมเดลช้า:** ลดค่า `plugins.entries.codex.config.discovery.timeoutMs`
หรือปิดการค้นหา

**WebSocket transport ล้มเหลวทันที:** ตรวจสอบ `appServer.url`, `authToken`
และตรวจสอบว่า app-server ระยะไกลใช้โปรโตคอล Codex app-server เวอร์ชันเดียวกัน

**โมเดลที่ไม่ใช่ Codex ใช้ PI:** นี่เป็นพฤติกรรมที่คาดไว้ Codex harness จะรับเฉพาะ
การอ้างอิงโมเดล `codex/*`

## ที่เกี่ยวข้อง

- [Plugin Agent Harness](/th/plugins/sdk-agent-harness)
- [Model Providers](/th/concepts/model-providers)
- [เอกสารอ้างอิงการตั้งค่า](/th/gateway/configuration-reference)
- [การทดสอบ](/th/help/testing#live-codex-app-server-harness-smoke)
