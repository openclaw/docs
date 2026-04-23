---
read_when:
    - คุณต้องการการตั้งค่า Moonshot K2 (Moonshot Open Platform) เทียบกับ Kimi Coding
    - คุณต้องการทำความเข้าใจปลายทาง คีย์ และการอ้างอิงโมเดลที่แยกจากกัน
    - คุณต้องการคอนฟิกแบบคัดลอก/วางสำหรับ provider ใด provider หนึ่ง
summary: ตั้งค่า Moonshot K2 เทียบกับ Kimi Coding (ผู้ให้บริการแยกกัน + คีย์แยกกัน)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T10:22:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e143632de7aff050f32917e379e21ace5f4a5f9857618ef720f885f2f298ca72
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot ให้บริการ Kimi API พร้อมปลายทางที่เข้ากันได้กับ OpenAI ให้ตั้งค่า
provider และกำหนดโมเดลเริ่มต้นเป็น `moonshot/kimi-k2.6` หรือใช้
Kimi Coding ด้วย `kimi/kimi-code`

<Warning>
Moonshot และ Kimi Coding เป็น **provider คนละตัวกัน** คีย์ไม่สามารถใช้แทนกันได้ ปลายทางต่างกัน และการอ้างอิงโมเดลก็ต่างกัน (`moonshot/...` เทียบกับ `kimi/...`)
</Warning>

## แค็ตตาล็อกโมเดลที่มีมาในตัว

[//]: # "moonshot-kimi-k2-ids:start"

| การอ้างอิงโมเดล                 | ชื่อ                   | Reasoning | อินพุต      | บริบท   | เอาต์พุตสูงสุด |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | -------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | ไม่        | text, image | 262,144 | 262,144        |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | ไม่        | text, image | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | ใช่        | text        | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | ใช่        | text        | 262,144 | 262,144        |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | ไม่        | text        | 256,000 | 16,384         |

[//]: # "moonshot-kimi-k2-ids:end"

การประเมินต้นทุนแบบ bundled สำหรับโมเดล K2 ที่โฮสต์บน Moonshot ในปัจจุบันใช้
อัตราใช้งานตามจริงที่ Moonshot เผยแพร่: Kimi K2.6 มีค่าใช้จ่าย $0.16/MTok สำหรับ cache hit,
$0.95/MTok สำหรับ input และ $4.00/MTok สำหรับ output; Kimi K2.5 มีค่าใช้จ่าย $0.10/MTok สำหรับ cache hit,
$0.60/MTok สำหรับ input และ $3.00/MTok สำหรับ output รายการแค็ตตาล็อก legacy อื่น ๆ
ยังคงใช้ placeholder ต้นทุนศูนย์ เว้นแต่คุณจะ override ในคอนฟิก

## เริ่มต้นใช้งาน

เลือก provider ของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Moonshot API">
    **เหมาะที่สุดสำหรับ:** โมเดล Kimi K2 ผ่าน Moonshot Open Platform

    <Steps>
      <Step title="เลือกภูมิภาคของปลายทาง">
        | ตัวเลือก auth          | ปลายทาง                       | ภูมิภาค         |
        | ---------------------- | ------------------------------ | --------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | ต่างประเทศ      |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | จีน             |
      </Step>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        หรือสำหรับปลายทางในจีน:

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
        ใช้ state dir แบบแยกเมื่อต้องการตรวจสอบการเข้าถึงโมเดลและการติดตามต้นทุน
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

        การตอบกลับแบบ JSON ควรรายงาน `provider: "moonshot"` และ
        `model: "kimi-k2.6"` รายการ transcript ของผู้ช่วยจะเก็บ
        การใช้งาน token ที่ normalize แล้วพร้อมต้นทุนโดยประมาณไว้ใต้ `usage.cost`
        เมื่อ Moonshot ส่งคืน metadata การใช้งาน
      </Step>
    </Steps>

    ### ตัวอย่างคอนฟิก

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
    **เหมาะที่สุดสำหรับ:** งานที่เน้นโค้ดผ่านปลายทาง Kimi Coding

    <Note>
    Kimi Coding ใช้ API key และคำนำหน้า provider (`kimi/...`) คนละชุดกับ Moonshot (`moonshot/...`) การอ้างอิงโมเดล legacy `kimi/k2p5` ยังคงยอมรับได้ในฐานะ id เพื่อความเข้ากันได้
    </Note>

    <Steps>
      <Step title="รัน onboarding">
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

    ### ตัวอย่างคอนฟิก

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

## การค้นหาเว็บของ Kimi

OpenClaw ยังมาพร้อม **Kimi** ในฐานะ provider `web_search` ซึ่งทำงานอยู่บน
การค้นหาเว็บของ Moonshot

<Steps>
  <Step title="รันการตั้งค่าการค้นหาเว็บแบบโต้ตอบ">
    ```bash
    openclaw configure --section web
    ```

    เลือก **Kimi** ในส่วนการค้นหาเว็บเพื่อเก็บ
    `plugins.entries.moonshot.config.webSearch.*`

  </Step>
  <Step title="ตั้งค่าภูมิภาคและโมเดลของการค้นหาเว็บ">
    การตั้งค่าแบบโต้ตอบจะถามเกี่ยวกับ:

    | การตั้งค่า            | ตัวเลือก                                                              |
    | -------------------- | -------------------------------------------------------------------- |
    | ภูมิภาค API          | `https://api.moonshot.ai/v1` (ต่างประเทศ) หรือ `https://api.moonshot.cn/v1` (จีน) |
    | โมเดลการค้นหาเว็บ    | ค่าเริ่มต้นคือ `kimi-k2.6`                                           |

  </Step>
</Steps>

คอนฟิกจะอยู่ใต้ `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // หรือใช้ KIMI_API_KEY / MOONSHOT_API_KEY
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

## ขั้นสูง

<AccordionGroup>
  <Accordion title="โหมด thinking แบบ native">
    Moonshot Kimi รองรับโหมด thinking แบบไบนารี:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    ตั้งค่าต่อโมเดลได้ผ่าน `agents.defaults.models.<provider/model>.params`:

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

    | ระดับ `/think`        | พฤติกรรมของ Moonshot       |
    | --------------------- | -------------------------- |
    | `/think off`          | `thinking.type=disabled`   |
    | ระดับอื่นที่ไม่ใช่ off | `thinking.type=enabled`    |

    <Warning>
    เมื่อเปิดใช้ Moonshot thinking, `tool_choice` ต้องเป็น `auto` หรือ `none` เท่านั้น OpenClaw จะ normalize ค่า `tool_choice` ที่ไม่เข้ากันให้เป็น `auto` เพื่อความเข้ากันได้
    </Warning>

    Kimi K2.6 ยังรองรับฟิลด์ `thinking.keep` แบบไม่บังคับ ซึ่งใช้ควบคุม
    การเก็บ `reasoning_content` ข้ามหลายเทิร์น ให้ตั้งเป็น `"all"` เพื่อเก็บ
    reasoning แบบเต็มข้ามหลายเทิร์น; หากไม่ใส่ (หรือปล่อยเป็น `null`) จะใช้กลยุทธ์
    ค่าเริ่มต้นของเซิร์ฟเวอร์ OpenClaw จะส่งต่อ `thinking.keep` เฉพาะสำหรับ
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
    Moonshot Kimi ให้บริการ tool_call id ในรูปแบบ `functions.<name>:<index>` OpenClaw จะคงค่าเหล่านี้ไว้ตามเดิมโดยไม่เปลี่ยนแปลง เพื่อให้การเรียกเครื่องมือข้ามหลายเทิร์นยังทำงานต่อได้

    หากต้องการบังคับใช้การทำความสะอาดแบบเข้มงวดบน provider แบบกำหนดเองที่เข้ากันได้กับ OpenAI ให้ตั้ง `sanitizeToolCallIds: true`:

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

  <Accordion title="ความเข้ากันได้ของการใช้งานแบบสตรีมมิง">
    ปลายทาง Moonshot แบบ native (`https://api.moonshot.ai/v1` และ
    `https://api.moonshot.cn/v1`) ประกาศความเข้ากันได้ของการใช้งานแบบสตรีมมิงบน
    transport `openai-completions` ที่ใช้ร่วมกัน OpenClaw จะอิงสิ่งนี้จากความสามารถของปลายทาง ดังนั้น id ของ provider แบบกำหนดเองที่เข้ากันได้ซึ่งชี้ไปยังโฮสต์ Moonshot แบบ native เดียวกันจะสืบทอดพฤติกรรมการใช้งานแบบสตรีมมิงเดียวกันด้วย

    ด้วยราคาของ K2.6 แบบ bundled การใช้งานแบบสตรีมที่มี input, output
    และ cache-read token จะถูกแปลงเป็นต้นทุน USD โดยประมาณในเครื่องด้วยสำหรับ
    `/status`, `/usage full`, `/usage cost` และการคิดบัญชีเซสชันที่อิงกับ transcript

  </Accordion>

  <Accordion title="เอกสารอ้างอิงปลายทางและการอ้างอิงโมเดล">
    | Provider     | คำนำหน้าการอ้างอิงโมเดล | ปลายทาง                      | Auth env var        |
    | ------------ | ------------------------ | ---------------------------- | ------------------- |
    | Moonshot     | `moonshot/`              | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`  |
    | Moonshot CN  | `moonshot/`              | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`  |
    | Kimi Coding  | `kimi/`                  | ปลายทาง Kimi Coding         | `KIMI_API_KEY`      |
    | การค้นหาเว็บ | N/A                      | เหมือนกับภูมิภาคของ Moonshot API | `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` |

    - การค้นหาเว็บของ Kimi ใช้ `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` และมีค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1` พร้อมโมเดล `kimi-k2.6`
    - Override ข้อมูลราคาและ metadata ของบริบทได้ใน `models.providers` หากจำเป็น
    - หาก Moonshot เผยแพร่ขีดจำกัดบริบทที่ต่างออกไปสำหรับโมเดล ให้ปรับ `contextWindow` ให้สอดคล้อง

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การค้นหาเว็บ" href="/th/tools/web" icon="magnifying-glass">
    การตั้งค่า provider การค้นหาเว็บ รวมถึง Kimi
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema คอนฟิกฉบับเต็มสำหรับ provider โมเดล และ Plugin
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    การจัดการ API key และเอกสารของ Moonshot
  </Card>
</CardGroup>
