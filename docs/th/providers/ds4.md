---
read_when:
    - คุณต้องการรัน OpenClaw กับ antirez/ds4
    - คุณต้องการแบ็กเอนด์ DeepSeek V4 Flash แบบภายในเครื่องที่รองรับการเรียกใช้เครื่องมือ
    - คุณต้องใช้การกำหนดค่า OpenClaw สำหรับ ds4-server
summary: เรียกใช้ OpenClaw ผ่าน ds4 ซึ่งเป็นเซิร์ฟเวอร์ DeepSeek V4 Flash แบบโลคัลที่เข้ากันได้กับ OpenAI
title: ds4
x-i18n:
    generated_at: "2026-06-27T18:12:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) ให้บริการ DeepSeek V4 Flash จากแบ็กเอนด์
Metal ในเครื่อง พร้อม API `/v1` ที่เข้ากันได้กับ OpenAI OpenClaw เชื่อมต่อกับ ds4
ผ่านตระกูลผู้ให้บริการทั่วไป `openai-completions`

ds4 ไม่ใช่ Plugin ผู้ให้บริการของ OpenClaw ที่บันเดิลมาให้ กำหนดค่าไว้ใต้
`models.providers.ds4` แล้วเลือก `ds4/deepseek-v4-flash`

- ID ผู้ให้บริการ: `ds4`
- Plugin: ไม่มี
- API: Chat Completions ที่เข้ากันได้กับ OpenAI (`openai-completions`)
- URL ฐานที่แนะนำ: `http://127.0.0.1:18000/v1`
- ID โมเดล: `deepseek-v4-flash`
- การเรียกใช้เครื่องมือ: รองรับผ่าน `tools` และ `tool_calls` แบบ OpenAI
- การให้เหตุผล: `thinking` และ `reasoning_effort` แบบ DeepSeek

## ข้อกำหนด

- macOS ที่รองรับ Metal
- เช็กเอาต์ ds4 ที่ใช้งานได้พร้อม `ds4-server` และไฟล์ GGUF ของ DeepSeek V4 Flash
- หน่วยความจำเพียงพอสำหรับ context ที่คุณเลือก ค่า `--ctx` ที่ใหญ่ขึ้นจะจัดสรร
  หน่วยความจำ KV มากขึ้นเมื่อเซิร์ฟเวอร์เริ่มทำงาน

<Warning>
รอบการทำงานของเอเจนต์ OpenClaw มีสคีมาเครื่องมือและ context ของพื้นที่ทำงาน context
ที่เล็กมาก เช่น `--ctx 4096` อาจผ่านการทดสอบ curl โดยตรง แต่ล้มเหลวในการรันเอเจนต์เต็มรูปแบบด้วย
`500 prompt exceeds context` ใช้อย่างน้อย `--ctx 32768` สำหรับการทดสอบ smoke ของเอเจนต์และเครื่องมือ
ใช้ `--ctx 393216` เฉพาะเมื่อคุณมีหน่วยความจำเพียงพอและต้องการพฤติกรรม Think Max ของ ds4
</Warning>

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เริ่ม ds4-server">
    แทนที่ `<DS4_DIR>` ด้วยพาธเช็กเอาต์ ds4 ของคุณ

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="ตรวจสอบเอนด์พอยต์ที่เข้ากันได้กับ OpenAI">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    การตอบกลับควรมี `deepseek-v4-flash`

  </Step>
  <Step title="เพิ่มการกำหนดค่าผู้ให้บริการ OpenClaw">
    เพิ่มการกำหนดค่าจาก [การกำหนดค่าเต็ม](#full-config) แล้วรันการตรวจสอบโมเดลแบบครั้งเดียว:

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

## การกำหนดค่าเต็ม

ใช้การกำหนดค่านี้เมื่อ ds4 กำลังรันอยู่แล้วบน `127.0.0.1:18000`

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

ให้ `contextWindow` ตรงกับค่า `ds4-server --ctx` ให้ `maxTokens`
ตรงกับ `--tokens` เว้นแต่คุณตั้งใจให้ OpenClaw ขอเอาต์พุตน้อยกว่าค่าเริ่มต้นของเซิร์ฟเวอร์

## การเริ่มต้นตามต้องการ

OpenClaw สามารถเริ่ม ds4 ได้เฉพาะเมื่อเลือกโมเดล `ds4/...` เพิ่ม
`localService` ในรายการผู้ให้บริการเดียวกัน:

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

`command` ต้องเป็นพาธไฟล์ปฏิบัติการแบบสัมบูรณ์ ไม่มีการใช้การค้นหาผ่านเชลล์และการขยาย `~`
ดู [บริการโมเดลในเครื่อง](/th/gateway/local-model-services) สำหรับทุกฟิลด์ของ
`localService`

## Think Max

ds4 ใช้ Think Max เฉพาะเมื่อเงื่อนไขทั้งสองข้อนี้เป็นจริง:

- `ds4-server` เริ่มด้วย `--ctx 393216` หรือสูงกว่า
- คำขอใช้ `reasoning_effort: "max"` หรือฟิลด์ effort ของ ds4 ที่เทียบเท่ากัน

หากคุณรัน context ขนาดใหญ่นั้น ให้อัปเดตทั้งแฟล็กของเซิร์ฟเวอร์และเมทาดาทาโมเดลของ OpenClaw:

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

## ทดสอบ

เริ่มด้วยการตรวจสอบ HTTP โดยตรง:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

จากนั้นทดสอบการกำหนดเส้นทางโมเดลของ OpenClaw:

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

สำหรับ smoke test แบบเอเจนต์เต็มและการเรียกใช้เครื่องมือ ให้ใช้ context อย่างน้อย 32768:

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
- `finalAssistantVisibleText` เริ่มด้วย `tool-ok`

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="curl /v1/models เชื่อมต่อไม่ได้">
    ds4 ไม่ได้รันอยู่ หรือไม่ได้ผูกกับโฮสต์และพอร์ตใน `baseUrl` เริ่ม
    `ds4-server` แล้วลองใหม่:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    `--ctx` ที่กำหนดค่าไว้เล็กเกินไปสำหรับรอบการทำงานของ OpenClaw เพิ่มค่า
    `ds4-server --ctx` แล้วอัปเดต `models.providers.ds4.models[].contextWindow`
    ให้ตรงกัน รอบการทำงานของเอเจนต์เต็มที่มีเครื่องมือต้องใช้ context มากกว่าคำขอ curl
    แบบข้อความเดียวโดยตรงอย่างมาก
  </Accordion>

  <Accordion title="Think Max ไม่เปิดใช้งาน">
    ds4 ใช้ Think Max เฉพาะเมื่อ `--ctx` มีค่าอย่างน้อย `393216` และคำขอ
    ขอ `reasoning_effort: "max"` context ที่เล็กกว่าจะย้อนกลับไปใช้การให้เหตุผลระดับสูง
  </Accordion>

  <Accordion title="คำขอแรกช้า">
    ds4 มีช่วง residency ของ Metal แบบ cold และช่วงวอร์มอัปโมเดล ใช้
    `localService.readyTimeoutMs: 300000` เมื่อ OpenClaw เริ่มเซิร์ฟเวอร์ตามต้องการ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="บริการโมเดลในเครื่อง" href="/th/gateway/local-model-services" icon="play">
    เริ่มเซิร์ฟเวอร์โมเดลในเครื่องตามต้องการก่อนคำขอโมเดล
  </Card>
  <Card title="โมเดลในเครื่อง" href="/th/gateway/local-models" icon="server">
    เลือกและใช้งานแบ็กเอนด์โมเดลในเครื่อง
  </Card>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    กำหนดค่า provider refs, การยืนยันตัวตน และ failover
  </Card>
  <Card title="DeepSeek" href="/th/providers/deepseek" icon="brain">
    พฤติกรรมผู้ให้บริการ DeepSeek แบบเนทีฟและการควบคุม thinking
  </Card>
</CardGroup>
