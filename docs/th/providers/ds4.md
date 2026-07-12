---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw กับ antirez/ds4
    - คุณต้องการแบ็กเอนด์ DeepSeek V4 Flash ภายในเครื่องที่รองรับการเรียกใช้เครื่องมือ
    - คุณต้องใช้การกำหนดค่า OpenClaw สำหรับ ds4-server
summary: เรียกใช้ OpenClaw ผ่าน ds4 ซึ่งเป็นเซิร์ฟเวอร์ DeepSeek V4 Flash ภายในเครื่องที่เข้ากันได้กับ OpenAI
title: ds4
x-i18n:
    generated_at: "2026-07-12T16:34:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) ให้บริการ DeepSeek V4 Flash จากแบ็กเอนด์
Metal ภายในเครื่องผ่าน API `/v1` ที่เข้ากันได้กับ OpenAI โดย OpenClaw เชื่อมต่อกับ ds4
ผ่านกลุ่มผู้ให้บริการทั่วไป `openai-completions`

ds4 ไม่ใช่ Plugin ผู้ให้บริการที่มาพร้อมกับ OpenClaw ให้กำหนดค่าภายใต้
`models.providers.ds4` แล้วเลือก `ds4/deepseek-v4-flash`

| คุณสมบัติ       | ค่า                                                        |
| --------------- | --------------------------------------------------------- |
| รหัสผู้ให้บริการ | `ds4`                                                     |
| Plugin          | ไม่มี (ใช้การกำหนดค่าเท่านั้น)                              |
| API             | Chat Completions ที่เข้ากันได้กับ OpenAI (`openai-completions`) |
| URL ฐาน         | `http://127.0.0.1:18000/v1` (แนะนำ)                       |
| รหัสโมเดล       | `deepseek-v4-flash`                                       |
| การเรียกใช้เครื่องมือ | `tools` / `tool_calls` รูปแบบ OpenAI                  |
| การใช้เหตุผล     | `thinking` และ `reasoning_effort` รูปแบบ DeepSeek          |

## ข้อกำหนด

- macOS ที่รองรับ Metal
- สำเนาโค้ด ds4 ที่ใช้งานได้ พร้อม `ds4-server` และไฟล์ GGUF ของ DeepSeek V4 Flash
- หน่วยความจำเพียงพอสำหรับบริบทที่คุณเลือก โดยค่า `--ctx` ที่มากขึ้นจะจัดสรร
  หน่วยความจำ KV เพิ่มขึ้นเมื่อเริ่มต้นเซิร์ฟเวอร์

<Warning>
รอบการทำงานของเอเจนต์ OpenClaw มีสคีมาของเครื่องมือและบริบทของพื้นที่ทำงานรวมอยู่ด้วย บริบทขนาดเล็กมาก
เช่น `--ctx 4096` อาจผ่านการทดสอบ curl โดยตรง แต่ล้มเหลวเมื่อเรียกใช้เอเจนต์เต็มรูปแบบด้วยข้อผิดพลาด
`500 prompt exceeds context` ใช้อย่างน้อย `--ctx 32768` สำหรับการทดสอบเบื้องต้นของเอเจนต์และเครื่องมือ
ใช้ `--ctx 393216` เฉพาะเมื่อมีหน่วยความจำเพียงพอและต้องการเปิดใช้งาน Think Max ของ ds4
</Warning>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เริ่มต้น ds4-server">
    แทนที่ `<DS4_DIR>` ด้วยพาธของสำเนาโค้ด ds4 ของคุณ

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="ตรวจสอบเอ็นด์พอยต์ที่เข้ากันได้กับ OpenAI">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    การตอบกลับควรมี `deepseek-v4-flash`

  </Step>
  <Step title="เพิ่มการกำหนดค่าผู้ให้บริการ OpenClaw">
    เพิ่มการกำหนดค่าจาก [การกำหนดค่าแบบเต็ม](#full-config) แล้วเรียกใช้การตรวจสอบโมเดล
    แบบครั้งเดียว:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## การกำหนดค่าแบบเต็ม

ใช้การกำหนดค่านี้เมื่อ ds4 กำลังทำงานอยู่ที่ `127.0.0.1:18000`

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

กำหนด `contextWindow` ให้สอดคล้องกับ `ds4-server --ctx` และกำหนด `maxTokens` ให้สอดคล้อง
กับ `--tokens` เว้นแต่คุณตั้งใจให้ OpenClaw ร้องขอเอาต์พุตน้อยกว่าค่าเริ่มต้น
ของเซิร์ฟเวอร์

## การเริ่มต้นตามต้องการ

OpenClaw สามารถเริ่มต้น ds4 เฉพาะเมื่อมีการเลือกโมเดล `ds4/...` เพิ่ม
`localService` ลงในรายการผู้ให้บริการเดียวกัน:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` ต้องเป็นพาธสัมบูรณ์ของไฟล์ปฏิบัติการ ระบบจะไม่ใช้การค้นหาผ่านเชลล์หรือการขยาย `~`
ดูฟิลด์ `localService` ทั้งหมดได้ที่ [บริการโมเดลภายในเครื่อง](/th/gateway/local-model-services)

## Think Max

ds4 ใช้ Think Max เฉพาะเมื่อเงื่อนไขทั้งสองข้อต่อไปนี้เป็นจริง:

- `ds4-server` เริ่มต้นด้วย `--ctx 393216` หรือสูงกว่า
- คำขอใช้ `reasoning_effort: "max"` (หรือฟิลด์ระดับการใช้เหตุผลที่เทียบเท่าของ ds4)

หากคุณใช้บริบทขนาดใหญ่นั้น ให้อัปเดตทั้งแฟล็กของเซิร์ฟเวอร์และข้อมูลเมตาของโมเดล
OpenClaw:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## การทดสอบ

ตรวจสอบ HTTP โดยตรงโดยข้าม OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

การกำหนดเส้นทางโมเดลของ OpenClaw (เหมือนกับการตรวจสอบในส่วนเริ่มต้นอย่างรวดเร็ว):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

การทดสอบเบื้องต้นของเอเจนต์เต็มรูปแบบและการเรียกใช้เครื่องมือ โดยมีบริบทอย่างน้อย 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

ผลลัพธ์ที่คาดหวัง:

- `executionTrace.winnerProvider` คือ `ds4`
- `executionTrace.winnerModel` คือ `deepseek-v4-flash`
- `toolSummary.calls` มีค่าอย่างน้อย `1`
- `finalAssistantVisibleText` ขึ้นต้นด้วย `tool-ok`

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="curl /v1/models ไม่สามารถเชื่อมต่อได้">
    ds4 ไม่ได้ทำงานอยู่หรือไม่ได้ผูกกับโฮสต์/พอร์ตใน `baseUrl` ให้เริ่มต้น
    `ds4-server` แล้วลองอีกครั้ง:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    ค่า `--ctx` ที่กำหนดไว้มีขนาดเล็กเกินไปสำหรับรอบการทำงานของ OpenClaw ให้เพิ่มค่า
    `ds4-server --ctx` แล้วอัปเดต `models.providers.ds4.models[].contextWindow`
    ให้ตรงกัน รอบการทำงานของเอเจนต์เต็มรูปแบบที่ใช้เครื่องมือต้องการบริบทมากกว่า
    คำขอ curl แบบข้อความเดียวโดยตรงอย่างมาก
  </Accordion>

  <Accordion title="Think Max ไม่เปิดใช้งาน">
    ds4 ใช้ Think Max เฉพาะเมื่อ `--ctx` มีค่าอย่างน้อย `393216` และคำขอ
    ร้องขอ `reasoning_effort: "max"` บริบทที่เล็กกว่าจะย้อนกลับไปใช้
    การใช้เหตุผลระดับสูง
  </Accordion>

  <Accordion title="คำขอแรกทำงานช้า">
    ds4 มีช่วงนำโมเดลเข้าสู่ Metal แบบเริ่มต้นจากสถานะเย็นและช่วงอุ่นเครื่องโมเดล ให้ตั้งค่า
    `localService.readyTimeoutMs: 300000` เมื่อ OpenClaw เริ่มต้นเซิร์ฟเวอร์
    ตามต้องการ
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="บริการโมเดลภายในเครื่อง" href="/th/gateway/local-model-services" icon="play">
    เริ่มต้นเซิร์ฟเวอร์โมเดลภายในเครื่องตามต้องการก่อนส่งคำขอไปยังโมเดล
  </Card>
  <Card title="โมเดลภายในเครื่อง" href="/th/gateway/local-models" icon="server">
    เลือกและใช้งานแบ็กเอนด์โมเดลภายในเครื่อง
  </Card>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    กำหนดค่าการอ้างอิงผู้ให้บริการ การยืนยันตัวตน และการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="DeepSeek" href="/th/providers/deepseek" icon="brain">
    ลักษณะการทำงานของผู้ให้บริการ DeepSeek แบบเนทีฟและการควบคุมการคิด
  </Card>
</CardGroup>
