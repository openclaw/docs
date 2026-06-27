---
read_when:
    - คุณต้องการตั้งค่า Moonshot K2 (Moonshot Open Platform) เทียบกับ Kimi Coding
    - คุณต้องเข้าใจ endpoint, คีย์ และการอ้างอิงโมเดลที่แยกจากกัน
    - คุณต้องการการกำหนดค่าแบบคัดลอก/วางสำหรับผู้ให้บริการตัวใดตัวหนึ่ง
summary: กำหนดค่า Moonshot K2 เทียบกับ Kimi Coding (ผู้ให้บริการและคีย์แยกกัน)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:14:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot ให้บริการ Kimi API พร้อม endpoint ที่เข้ากันได้กับ OpenAI กำหนดค่า
provider และตั้งค่าโมเดลเริ่มต้นเป็น `moonshot/kimi-k2.6` หรือใช้
Kimi Coding ด้วย `kimi/kimi-for-coding`

<Warning>
Moonshot และ Kimi Coding เป็น **provider แยกกัน** คีย์ใช้แทนกันไม่ได้, endpoint แตกต่างกัน และ model ref แตกต่างกัน (`moonshot/...` เทียบกับ `kimi/...`)
</Warning>

## แค็ตตาล็อกโมเดลในตัว

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | ชื่อ                   | การให้เหตุผล | อินพุต       | Context | เอาต์พุตสูงสุด |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | ไม่        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | เปิดเสมอ | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | ไม่        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | ใช่       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | ใช่       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | ไม่        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

การประมาณต้นทุนในแค็ตตาล็อกสำหรับโมเดล K2 ปัจจุบันที่โฮสต์โดย Moonshot ใช้อัตรา
จ่ายตามการใช้งานที่ Moonshot เผยแพร่: Kimi K2.7 Code คือ $0.19/MTok เมื่อ cache hit,
$0.95/MTok สำหรับอินพุต และ $4.00/MTok สำหรับเอาต์พุต; Kimi K2.6 คือ $0.16/MTok เมื่อ cache hit,
$0.95/MTok สำหรับอินพุต และ $4.00/MTok สำหรับเอาต์พุต; Kimi K2.5 คือ $0.10/MTok เมื่อ cache hit,
$0.60/MTok สำหรับอินพุต และ $3.00/MTok สำหรับเอาต์พุต รายการแค็ตตาล็อกเดิมอื่นๆ คง
placeholder ต้นทุนศูนย์ไว้ เว้นแต่คุณจะ override ใน config

Kimi K2.7 Code ใช้ native thinking เสมอ OpenClaw เปิดเผยเฉพาะสถานะ thinking `on`
สำหรับโมเดลนี้ และละเว้นการควบคุม `thinking` และ
`reasoning_effort` ขาออก ตามที่ Moonshot กำหนด OpenClaw ยังละเว้น
sampling override ที่ K2.7 กำหนดตายตัวเป็นค่าเริ่มต้นของ provider Kimi K2.6 ยังคงเป็น
ค่าเริ่มต้นสำหรับ onboarding

## เริ่มต้นใช้งาน

เลือก provider ของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Moonshot API">
    **เหมาะที่สุดสำหรับ:** โมเดล Kimi K2 ผ่าน Moonshot Open Platform

    <Steps>
      <Step title="Choose your endpoint region">
        | ตัวเลือกการยืนยันตัวตน            | Endpoint                       | ภูมิภาค        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | นานาชาติ |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | จีน         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        หรือสำหรับ endpoint ประเทศจีน:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        ใช้ state dir ที่แยกไว้เมื่อต้องการตรวจสอบการเข้าถึงโมเดลและการติดตามต้นทุน
        โดยไม่แตะเซสชันปกติของคุณ:

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
        `model: "kimi-k2.6"` รายการ transcript ของ assistant จะเก็บการใช้งาน
        token ที่ normalize แล้วพร้อมต้นทุนโดยประมาณไว้ใต้ `usage.cost` เมื่อ Moonshot ส่งคืน
        usage metadata
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
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
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
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
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
    ติดตั้ง Plugin ทางการ จากนั้นรีสตาร์ท Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **เหมาะที่สุดสำหรับ:** งานที่เน้นโค้ดผ่าน endpoint ของ Kimi Coding

    <Note>
    Kimi Coding ใช้ API key และ prefix ของ provider (`kimi/...`) ต่างจาก Moonshot (`moonshot/...`) model ref ของ API เสถียรคือ `kimi/kimi-for-coding`; ref เดิม `kimi/kimi-code` และ `kimi/k2p5` ยังคงยอมรับได้และ normalize เป็น API model id นั้น
    </Note>

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
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

Plugin ของ Moonshot ยังลงทะเบียน **Kimi** เป็น provider `web_search` ซึ่งรองรับด้วยการค้นหาเว็บของ Moonshot

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    เลือก **Kimi** ในส่วน web-search เพื่อจัดเก็บ
    `plugins.entries.moonshot.config.webSearch.*`

  </Step>
  <Step title="Configure the web search region and model">
    การตั้งค่าแบบโต้ตอบจะแจ้งให้กรอก:

    | การตั้งค่า             | ตัวเลือก                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | ภูมิภาค API          | `https://api.moonshot.ai/v1` (นานาชาติ) หรือ `https://api.moonshot.cn/v1` (จีน) |
    | โมเดลค้นหาเว็บ    | ค่าเริ่มต้นคือ `kimi-k2.6`                                             |

  </Step>
</Steps>

Config อยู่ใต้ `plugins.entries.moonshot.config.webSearch`:

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

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Native thinking mode">
    Kimi K2.7 Code ใช้ native thinking เสมอ Moonshot กำหนดให้ client
    ละเว้นฟิลด์ `thinking` สำหรับโมเดลนี้ ดังนั้น OpenClaw จึงเปิดเผยเฉพาะ `on` และ
    เพิกเฉยต่อการตั้งค่า `off` ที่ล้าสมัย K2.7 ยังกำหนด `temperature`, `top_p`, `n`,
    `presence_penalty` และ `frequency_penalty` ไว้ตายตัว; OpenClaw จะละเว้น override ที่กำหนดค่าไว้
    สำหรับฟิลด์เหล่านั้น

    โมเดล Moonshot Kimi อื่นรองรับ binary native thinking:

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

    OpenClaw แมประดับ runtime `/think` สำหรับโมเดลเหล่านั้น:

    | ระดับ `/think`       | พฤติกรรมของ Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | ระดับใดๆ ที่ไม่ใช่ off    | `thinking.type=enabled`    |

    <Warning>
    เมื่อเปิดใช้งาน thinking ของ Moonshot แล้ว `tool_choice` ต้องเป็น `auto` หรือ `none` OpenClaw จะ normalize ค่าที่เข้ากันไม่ได้เป็น `auto` ซึ่งรวมถึง Kimi K2.7 Code ที่ไม่สามารถปิดโหมด thinking เพื่อคง tool choice ที่ pin ไว้ได้
    </Warning>

    Kimi K2.6 ยังรับฟิลด์ `thinking.keep` แบบไม่บังคับซึ่งควบคุม
    การคง `reasoning_content` ข้ามหลายเทิร์น ตั้งค่าเป็น `"all"` เพื่อเก็บ
    เหตุผลทั้งหมดข้ามเทิร์น; ละไว้ (หรือปล่อยเป็น `null`) เพื่อใช้กลยุทธ์
    เริ่มต้นของเซิร์ฟเวอร์ OpenClaw จะส่งต่อ `thinking.keep` เฉพาะสำหรับ
    `moonshot/kimi-k2.6` และจะตัดออกจากโมเดลอื่น Kimi K2.7 Code
    เก็บประวัติเหตุผลทั้งหมดตามค่าเริ่มต้น ขณะที่ OpenClaw ละฟิลด์
    `thinking` ทั้งหมด

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

  <Accordion title="การปรับ id ของการเรียกเครื่องมือให้ปลอดภัย">
    Moonshot Kimi ให้บริการ id ของ tool_call แบบเนทีฟที่มีรูปแบบ `functions.<name>:<index>` สำหรับทรานสปอร์ต OpenAI-completions OpenClaw จะคงรายการแรกของ id Kimi แบบเนทีฟแต่ละรายการไว้ และเขียนรายการซ้ำภายหลังใหม่เป็น id แบบ OpenAI ที่กำหนดได้แน่นอนในรูป `call_*` ผลลัพธ์เครื่องมือที่ตรงกันจะถูกแมปใหม่ด้วย id เดียวกัน เพื่อให้การเล่นซ้ำยังคงไม่ซ้ำกันโดยไม่ตัด id แบบเนทีฟรายการแรกของ Kimi ออก

    หากต้องการบังคับใช้การปรับให้ปลอดภัยอย่างเข้มงวดกับผู้ให้บริการแบบกำหนดเองที่เข้ากันได้กับ OpenAI ให้ตั้งค่า `sanitizeToolCallIds: true`:

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

  <Accordion title="ความเข้ากันได้ของการใช้งานแบบสตรีม">
    Endpoint เนทีฟของ Moonshot (`https://api.moonshot.ai/v1` และ
    `https://api.moonshot.cn/v1`) ประกาศความเข้ากันได้ของการใช้งานแบบสตรีมบน
    ทรานสปอร์ต `openai-completions` ที่ใช้ร่วมกัน OpenClaw อิงสิ่งนั้นจากความสามารถของ endpoint
    ดังนั้น id ผู้ให้บริการแบบกำหนดเองที่เข้ากันได้ซึ่งชี้ไปยังโฮสต์ Moonshot
    เนทีฟเดียวกันจะได้รับพฤติกรรมการใช้งานแบบสตรีมเดียวกัน

    ด้วยราคาของ K2.6 ในแค็ตตาล็อก การใช้งานแบบสตรีมที่รวมโทเค็นอินพุต เอาต์พุต
    และ cache-read จะถูกแปลงเป็นต้นทุนโดยประมาณใน USD ภายในเครื่องสำหรับ
    `/status`, `/usage full`, `/usage cost` และการคิดบัญชีเซสชัน
    ที่อ้างอิงจาก transcript ด้วย

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิง endpoint และ model ref">
    | ผู้ให้บริการ | คำนำหน้า model ref | Endpoint                      | ตัวแปร env สำหรับการยืนยันตัวตน |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | endpoint ของ Kimi Coding      | `KIMI_API_KEY`      |
    | การค้นหาเว็บ | N/A              | เหมือนกับภูมิภาค Moonshot API | `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` |

    - การค้นหาเว็บของ Kimi ใช้ `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` และมีค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1` พร้อมโมเดล `kimi-k2.6`
    - แทนที่ราคาและ metadata ของ context ใน `models.providers` หากจำเป็น
    - หาก Moonshot เผยแพร่ขีดจำกัด context ที่แตกต่างกันสำหรับโมเดล ให้ปรับ `contextWindow` ให้เหมาะสม

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model ref และพฤติกรรม failover
  </Card>
  <Card title="การค้นหาเว็บ" href="/th/tools/web" icon="magnifying-glass">
    การกำหนดค่าผู้ให้บริการค้นหาเว็บ รวมถึง Kimi
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็มสำหรับผู้ให้บริการ โมเดล และ plugins
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    การจัดการคีย์ Moonshot API และเอกสารประกอบ
  </Card>
</CardGroup>
