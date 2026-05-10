---
read_when:
    - คุณต้องการตั้งค่า Moonshot K2 (Moonshot Open Platform) เทียบกับ Kimi Coding
    - คุณต้องเข้าใจปลายทาง คีย์ และการอ้างอิงโมเดลที่แยกจากกัน
    - คุณต้องการการกำหนดค่าแบบคัดลอก/วางได้สำหรับผู้ให้บริการรายใดรายหนึ่ง
summary: กำหนดค่า Moonshot K2 เทียบกับ Kimi Coding (ผู้ให้บริการและคีย์แยกกัน)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:55:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot ให้บริการ Kimi API พร้อม endpoint ที่เข้ากันได้กับ OpenAI กำหนดค่า
provider และตั้งค่าโมเดลเริ่มต้นเป็น `moonshot/kimi-k2.6` หรือใช้
Kimi Coding ด้วย `kimi/kimi-for-coding`

<Warning>
Moonshot และ Kimi Coding เป็น **provider แยกกัน** คีย์ใช้แทนกันไม่ได้, endpoint ต่างกัน, และ model ref ต่างกัน (`moonshot/...` เทียบกับ `kimi/...`)
</Warning>

## แคตตาล็อกโมเดลในตัว

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | ชื่อ                   | การให้เหตุผล | อินพุต       | บริบท | เอาต์พุตสูงสุด |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | ไม่ใช่        | ข้อความ, รูปภาพ | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | ไม่ใช่        | ข้อความ, รูปภาพ | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | ใช่       | ข้อความ        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | ใช่       | ข้อความ        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | ไม่ใช่        | ข้อความ        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

การประมาณค่าใช้จ่ายที่รวมมากับโมเดล K2 ปัจจุบันที่โฮสต์โดย Moonshot ใช้อัตราแบบจ่ายตามการใช้งานจริงที่ Moonshot
เผยแพร่ไว้: Kimi K2.6 คือ $0.16/MTok สำหรับ cache hit,
$0.95/MTok อินพุต, และ $4.00/MTok เอาต์พุต; Kimi K2.5 คือ $0.10/MTok สำหรับ cache hit,
$0.60/MTok อินพุต, และ $3.00/MTok เอาต์พุต รายการแคตตาล็อกเดิมอื่นๆ จะคง
placeholder ค่าใช้จ่ายเป็นศูนย์ไว้ เว้นแต่คุณจะแทนที่ใน config

## เริ่มต้นใช้งาน

เลือก provider ของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Moonshot API">
    **เหมาะที่สุดสำหรับ:** โมเดล Kimi K2 ผ่าน Moonshot Open Platform

    <Steps>
      <Step title="เลือกภูมิภาค endpoint ของคุณ">
        | ตัวเลือกการยืนยันตัวตน            | Endpoint                       | ภูมิภาค        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | นานาชาติ |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | จีน         |
      </Step>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        หรือสำหรับ endpoint ของจีน:

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
      <Step title="เรียกใช้ smoke test แบบสด">
        ใช้ไดเรกทอรีสถานะแยกต่างหากเมื่อคุณต้องการตรวจสอบการเข้าถึงโมเดลและการติดตามค่าใช้จ่าย
        โดยไม่แตะต้องเซสชันปกติของคุณ:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        การตอบกลับ JSON ควรรายงาน `provider: "moonshot"` และ
        `model: "kimi-k2.6"` รายการ transcript ของผู้ช่วยจะจัดเก็บ
        การใช้ token ที่ปรับให้เป็นมาตรฐานแล้ว รวมถึงค่าใช้จ่ายโดยประมาณภายใต้ `usage.cost` เมื่อ Moonshot ส่งคืน
        metadata การใช้งาน
      </Step>
    </Steps>

    ### ตัวอย่าง Config

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
    **เหมาะที่สุดสำหรับ:** งานที่เน้นโค้ดผ่าน endpoint ของ Kimi Coding

    <Note>
    Kimi Coding ใช้คีย์ API และคำนำหน้า provider (`kimi/...`) ที่ต่างจาก Moonshot (`moonshot/...`) model ref ของ API ที่เสถียรคือ `kimi/kimi-for-coding`; ref เดิม `kimi/kimi-code` และ `kimi/k2p5` ยังคงยอมรับและ normalize เป็น API model id นั้น
    </Note>

    <Steps>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
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

    ### ตัวอย่าง Config

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## การค้นหาเว็บของ Kimi

OpenClaw ยังมาพร้อมกับ **Kimi** ในฐานะผู้ให้บริการ `web_search` ซึ่งขับเคลื่อนโดยการค้นหาเว็บของ Moonshot

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    เลือก **Kimi** ในส่วนการค้นหาเว็บเพื่อจัดเก็บ
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure the web search region and model">
    การตั้งค่าแบบโต้ตอบจะแจ้งให้กรอก:

    | การตั้งค่า             | ตัวเลือก                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | ภูมิภาค API          | `https://api.moonshot.ai/v1` (สากล) หรือ `https://api.moonshot.cn/v1` (จีน) |
    | โมเดลการค้นหาเว็บ    | ค่าเริ่มต้นคือ `kimi-k2.6`                                             |

  </Step>
</Steps>

การตั้งค่าอยู่ภายใต้ `plugins.entries.moonshot.config.webSearch`:

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
  <Accordion title="Native thinking mode">
    Moonshot Kimi รองรับโหมดการคิดแบบเนทีฟชนิดไบนารี:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    ตั้งค่าต่อโมเดลผ่าน `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw ยังแมประดับ runtime `/think` สำหรับ Moonshot ด้วย:

    | ระดับ `/think`       | พฤติกรรมของ Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | ระดับใดก็ตามที่ไม่ใช่ off    | `thinking.type=enabled`    |

    <Warning>
    เมื่อเปิดใช้งานการคิดของ Moonshot แล้ว `tool_choice` ต้องเป็น `auto` หรือ `none` OpenClaw จะปรับค่า `tool_choice` ที่ไม่เข้ากันให้เป็น `auto` เพื่อความเข้ากันได้
    </Warning>

    Kimi K2.6 ยังรับฟิลด์ `thinking.keep` ที่เป็นตัวเลือก ซึ่งควบคุม
    การคง `reasoning_content` ไว้ข้ามหลายเทิร์น ตั้งค่าเป็น `"all"` เพื่อเก็บ
    reasoning ทั้งหมดข้ามเทิร์น; ละเว้นฟิลด์นี้ (หรือปล่อยให้เป็น `null`) เพื่อใช้กลยุทธ์
    ค่าเริ่มต้นของเซิร์ฟเวอร์ OpenClaw จะส่งต่อ `thinking.keep` เฉพาะสำหรับ
    `moonshot/kimi-k2.6` และจะตัดฟิลด์นี้ออกจากโมเดลอื่น

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

  <Accordion title="Tool call id sanitization">
    Moonshot Kimi ให้บริการ tool_call ids ที่มีรูปแบบเช่น `functions.<name>:<index>` OpenClaw จะคงค่าเหล่านั้นไว้เหมือนเดิมเพื่อให้การเรียกเครื่องมือหลายเทิร์นยังทำงานต่อไปได้

    หากต้องการบังคับใช้การทำให้เป็นรูปแบบปลอดภัยอย่างเคร่งครัดกับผู้ให้บริการแบบกำหนดเองที่เข้ากันได้กับ OpenAI ให้ตั้งค่า `sanitizeToolCallIds: true`:

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

  <Accordion title="Streaming usage compatibility">
    Endpoint แบบเนทีฟของ Moonshot (`https://api.moonshot.ai/v1` และ
    `https://api.moonshot.cn/v1`) ประกาศความเข้ากันได้ของการใช้งานแบบสตรีมบน
    transport `openai-completions` ที่ใช้ร่วมกัน OpenClaw อิงค่าดังกล่าวจาก
    ความสามารถของ endpoint ดังนั้น ids ผู้ให้บริการแบบกำหนดเองที่เข้ากันได้ซึ่งชี้ไปยังโฮสต์
    Moonshot แบบเนทีฟเดียวกันจะสืบทอดพฤติกรรม streaming-usage เดียวกัน

    ด้วยราคาของ K2.6 ที่รวมมาให้ การใช้งานแบบสตรีมที่รวมโทเคนขาเข้า ขาออก
    และ cache-read จะถูกแปลงเป็นต้นทุน USD โดยประมาณในเครื่องสำหรับ
    `/status`, `/usage full`, `/usage cost` และการบันทึกบัญชีเซสชัน
    ที่อ้างอิงจาก transcript ด้วย

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงปลายทางและ model ref">
    | ผู้ให้บริการ   | คำนำหน้า model ref | ปลายทาง                      | ตัวแปรสภาพแวดล้อมสำหรับ Auth        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | ปลายทาง Kimi Coding          | `KIMI_API_KEY`      |
    | การค้นหาเว็บ | N/A              | เหมือนกับภูมิภาค Moonshot API   | `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` |

    - การค้นหาเว็บของ Kimi ใช้ `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` และค่าเริ่มต้นคือ `https://api.moonshot.ai/v1` พร้อมโมเดล `kimi-k2.6`
    - แทนที่ราคาและเมทาดาทาบริบทใน `models.providers` หากจำเป็น
    - หาก Moonshot เผยแพร่ขีดจำกัดบริบทที่แตกต่างกันสำหรับโมเดล ให้ปรับ `contextWindow` ให้สอดคล้อง

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="การค้นหาเว็บ" href="/th/tools/web" icon="magnifying-glass">
    การกำหนดค่าผู้ให้บริการค้นหาเว็บ รวมถึง Kimi
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าแบบครบถ้วนสำหรับผู้ให้บริการ โมเดล และ plugins
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    การจัดการคีย์ Moonshot API และเอกสารประกอบ
  </Card>
</CardGroup>
