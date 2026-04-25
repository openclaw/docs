---
read_when:
    - คุณต้องการตั้งค่า Moonshot K2 (Moonshot Open Platform) เทียบกับ Kimi Coding
    - คุณต้องเข้าใจ endpoint, คีย์ และการอ้างอิงโมเดลที่แยกกัน
    - คุณต้องการการตั้งค่าที่คัดลอกและวางได้สำหรับผู้ให้บริการแต่ละราย
summary: กำหนดค่า Moonshot K2 เทียบกับ Kimi Coding (ผู้ให้บริการและคีย์แยกกัน)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-25T13:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 15
---

Moonshot มี Kimi API ที่ใช้ endpoint แบบเข้ากันได้กับ OpenAI กำหนดค่า
ผู้ให้บริการและตั้งโมเดลเริ่มต้นเป็น `moonshot/kimi-k2.6` หรือใช้
Kimi Coding กับ `kimi/kimi-code`

<Warning>
Moonshot และ Kimi Coding เป็น **ผู้ให้บริการแยกกัน** คีย์ใช้แทนกันไม่ได้ endpoint ต่างกัน และการอ้างอิงโมเดลก็ต่างกัน (`moonshot/...` เทียบกับ `kimi/...`)
</Warning>

## แค็ตตาล็อกโมเดลในตัว

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Name                   | Reasoning | Input       | Context | Max output |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | ไม่ใช่        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | ไม่ใช่        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | ใช่       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | ใช่       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | ไม่ใช่        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

ประมาณการต้นทุนที่มาพร้อมระบบสำหรับโมเดล K2 ที่โฮสต์โดย Moonshot ในปัจจุบันใช้
อัตราค่าบริการแบบจ่ายตามการใช้งานที่ Moonshot เผยแพร่: Kimi K2.6 อยู่ที่ $0.16/MTok สำหรับ cache hit,
$0.95/MTok สำหรับ input และ $4.00/MTok สำหรับ output; Kimi K2.5 อยู่ที่ $0.10/MTok สำหรับ cache hit,
$0.60/MTok สำหรับ input และ $3.00/MTok สำหรับ output รายการแค็ตตาล็อกรุ่นเก่าอื่น ๆ
จะคง placeholder ต้นทุนเป็นศูนย์ไว้ เว้นแต่คุณจะ override ในการตั้งค่า

## เริ่มต้นใช้งาน

เลือกผู้ให้บริการของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Moonshot API">
    **เหมาะสำหรับ:** โมเดล Kimi K2 ผ่าน Moonshot Open Platform

    <Steps>
      <Step title="เลือก region ของ endpoint ของคุณ">
        | Auth choice            | Endpoint                       | Region        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        หรือสำหรับ endpoint ประเทศจีน:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="รัน live smoke test">
        ใช้ state dir แบบแยกเมื่อคุณต้องการตรวจสอบการเข้าถึงโมเดลและการติดตาม
        ต้นทุนโดยไม่กระทบกับเซสชันปกติของคุณ:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        การตอบกลับแบบ JSON ควรรายงาน `provider: "moonshot"` และ
        `model: "kimi-k2.6"` รายการ transcript ของผู้ช่วยจะเก็บ
        การใช้งานโทเค็นที่ปรับให้เป็นมาตรฐานแล้ว พร้อมต้นทุนโดยประมาณไว้ใต้ `usage.cost` เมื่อ Moonshot ส่ง
        usage metadata กลับมา
      </Step>
    </Steps>

    ### ตัวอย่างการตั้งค่า

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **เหมาะสำหรับ:** งานที่เน้นโค้ดผ่าน endpoint ของ Kimi Coding

    <Note>
    Kimi Coding ใช้คีย์ API และคำนำหน้าผู้ให้บริการ (`kimi/...`) ที่ต่างจาก Moonshot (`moonshot/...`) การอ้างอิงโมเดลแบบเก่า `kimi/k2p5` ยังคงใช้งานได้ในฐานะ compatibility id
    </Note>

    <Steps>
      <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### ตัวอย่างการตั้งค่า

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web search

OpenClaw ยังมาพร้อม **Kimi** ในฐานะผู้ให้บริการ `web_search` ซึ่งขับเคลื่อนโดย Moonshot web
search

<Steps>
  <Step title="เรียกใช้การตั้งค่า web search แบบโต้ตอบ">
    ```bash
    openclaw configure --section web
    ```

    เลือก **Kimi** ในส่วน web-search เพื่อจัดเก็บ
    `plugins.entries.moonshot.config.webSearch.*`

  </Step>
  <Step title="กำหนดค่า region และโมเดลของ web search">
    การตั้งค่าแบบโต้ตอบจะถามค่าเหล่านี้:

    | Setting             | Options                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API region          | `https://api.moonshot.ai/v1` (international) หรือ `https://api.moonshot.cn/v1` (China) |
    | โมเดล web search    | ค่าเริ่มต้นคือ `kimi-k2.6`                                             |

  </Step>
</Steps>

การตั้งค่าจะอยู่ใต้ `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมด thinking แบบเนทีฟ">
    Moonshot Kimi รองรับ thinking แบบเนทีฟชนิดไบนารี:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    กำหนดค่าต่อโมเดลผ่าน `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw ยังแมประดับ `/think` ระหว่างรันไทม์สำหรับ Moonshot ด้วย:

    | ระดับ `/think`       | พฤติกรรมของ Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | ระดับอื่นใดที่ไม่ใช่ off    | `thinking.type=enabled`    |

    <Warning>
    เมื่อเปิดใช้ Moonshot thinking, `tool_choice` ต้องเป็น `auto` หรือ `none` OpenClaw จะทำให้ค่า `tool_choice` ที่ไม่เข้ากันเป็น `auto` เพื่อความเข้ากันได้
    </Warning>

    Kimi K2.6 ยังรองรับฟิลด์ `thinking.keep` แบบไม่บังคับ ซึ่งควบคุม
    การเก็บ `reasoning_content` สำหรับหลายเทิร์น ตั้งค่าเป็น `"all"` เพื่อเก็บ
    reasoning ทั้งหมดข้ามเทิร์น หรือไม่ต้องระบุ (หรือปล่อยเป็น `null`) เพื่อใช้
    กลยุทธ์ค่าเริ่มต้นของเซิร์ฟเวอร์ OpenClaw จะส่งต่อ `thinking.keep` เฉพาะสำหรับ
    `moonshot/kimi-k2.6` เท่านั้น และจะลบออกจากโมเดลอื่น

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การทำความสะอาด tool call id">
    Moonshot Kimi ส่ง tool_call id ในรูปแบบ `functions.<name>:<index>` OpenClaw จะคงค่าเหล่านี้ไว้ตามเดิมโดยไม่เปลี่ยนแปลง เพื่อให้การเรียกใช้เครื่องมือแบบหลายเทิร์นยังทำงานต่อได้

    หากต้องการบังคับใช้การทำความสะอาดแบบเข้มงวดกับผู้ให้บริการแบบเข้ากันได้กับ OpenAI แบบกำหนดเอง ให้ตั้ง `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ความเข้ากันได้ของ streaming usage">
    endpoint Moonshot แบบเนทีฟ (`https://api.moonshot.ai/v1` และ
    `https://api.moonshot.cn/v1`) ระบุว่ารองรับ streaming usage บน
    transport `openai-completions` แบบใช้ร่วมกัน OpenClaw จะอิงจากความสามารถของ endpoint
    ดังนั้น provider id แบบกำหนดเองที่เข้ากันได้ซึ่งชี้ไปยังโฮสต์ Moonshot เนทีฟเดียวกัน
    จะได้รับพฤติกรรม streaming-usage แบบเดียวกันด้วย

    ด้วย pricing ของ K2.6 ที่มาพร้อมระบบ ข้อมูล usage แบบสตรีมที่มี input, output,
    และ cache-read tokens จะถูกแปลงเป็นต้นทุน USD โดยประมาณในเครื่องสำหรับ
    `/status`, `/usage full`, `/usage cost` และการคำนวณระดับเซสชันที่อิง transcript
    ด้วย

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิง endpoint และ model ref">
    | Provider   | คำนำหน้า Model ref | Endpoint                      | ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน |
    | ---------- | ------------------ | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`        | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`        | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`            | endpoint ของ Kimi Coding          | `KIMI_API_KEY`      |
    | Web search | N/A                | เหมือนกับ region ของ Moonshot API   | `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` |

    - Kimi web search ใช้ `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` และใช้ค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1` กับโมเดล `kimi-k2.6`
    - Override metadata ของ pricing และ context ได้ใน `models.providers` หากจำเป็น
    - หาก Moonshot เผยแพร่ขีดจำกัด context ที่ต่างออกไปสำหรับโมเดลใด ให้ปรับ `contextWindow` ให้เหมาะสม

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, การอ้างอิงโมเดล และพฤติกรรมการสลับสำรอง
  </Card>
  <Card title="Web search" href="/th/tools/web" icon="magnifying-glass">
    การกำหนดค่าผู้ให้บริการ web search รวมถึง Kimi
  </Card>
  <Card title="ข้อมูลอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการตั้งค่าแบบเต็มสำหรับผู้ให้บริการ โมเดล และปลั๊กอิน
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    การจัดการคีย์ API ของ Moonshot และเอกสารประกอบ
  </Card>
</CardGroup>
