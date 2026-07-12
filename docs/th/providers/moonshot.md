---
read_when:
    - คุณต้องการตั้งค่า Moonshot K2 (Moonshot Open Platform) หรือ Kimi Coding
    - คุณต้องเข้าใจปลายทาง คีย์ และการอ้างอิงโมเดลที่แยกจากกัน
    - คุณต้องการการกำหนดค่าที่คัดลอกและวางได้สำหรับผู้ให้บริการรายใดรายหนึ่ง
summary: กำหนดค่า Moonshot K2 เทียบกับ Kimi Coding (ผู้ให้บริการและคีย์แยกกัน)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T16:40:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot ให้บริการ Kimi API ผ่านเอ็นด์พอยต์ที่เข้ากันได้กับ OpenAI ตั้งค่าโมเดลเริ่มต้นเป็น `moonshot/kimi-k2.6` สำหรับ Moonshot Open Platform หรือ `kimi/kimi-for-coding` สำหรับ Kimi Coding

<Warning>
Moonshot และ Kimi Coding เป็น **ผู้ให้บริการแยกจากกัน** โดยแต่ละรายจัดส่งเป็น Plugin ภายนอกคนละตัว คีย์ไม่สามารถใช้แทนกันได้ เอ็นด์พอยต์แตกต่างกัน และการอ้างอิงโมเดลแตกต่างกัน (`moonshot/...` เทียบกับ `kimi/...`)
</Warning>

## แค็ตตาล็อกโมเดลในตัว

[//]: # "moonshot-kimi-k2-ids:start"

| การอ้างอิงโมเดล                  | ชื่อ                   | การให้เหตุผล | อินพุต       | บริบท  | เอาต์พุตสูงสุด |
| --------------------------------- | ---------------------- | ------------ | ------------ | ------- | -------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | ไม่           | ข้อความ, รูปภาพ | 262,144 | 262,144        |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | เปิดตลอดเวลา | ข้อความ, รูปภาพ | 262,144 | 262,144        |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | ไม่           | ข้อความ, รูปภาพ | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | ใช่           | ข้อความ       | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | ใช่           | ข้อความ       | 262,144 | 262,144        |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | ไม่           | ข้อความ       | 256,000 | 16,384         |

[//]: # "moonshot-kimi-k2-ids:end"

การประมาณค่าใช้จ่ายในแค็ตตาล็อกใช้อัตราแบบจ่ายตามการใช้งานที่ Moonshot เผยแพร่: Kimi K2.7 Code มีค่าใช้จ่าย $0.19/MTok เมื่อพบข้อมูลในแคช, $0.95/MTok สำหรับอินพุต และ $4.00/MTok สำหรับเอาต์พุต; Kimi K2.6 มีค่าใช้จ่าย $0.16/MTok เมื่อพบข้อมูลในแคช, $0.95/MTok สำหรับอินพุต และ $4.00/MTok สำหรับเอาต์พุต; Kimi K2.5 มีค่าใช้จ่าย $0.10/MTok เมื่อพบข้อมูลในแคช, $0.60/MTok สำหรับอินพุต และ $3.00/MTok สำหรับเอาต์พุต รายการอื่นในแค็ตตาล็อกจะคงค่าตัวยึดค่าใช้จ่ายเป็นศูนย์ไว้ เว้นแต่คุณจะกำหนดค่าแทนที่ในการกำหนดค่า

Kimi K2.7 Code ใช้การคิดแบบเนทีฟเสมอ OpenClaw เปิดให้ใช้เฉพาะสถานะการคิด `on` สำหรับโมเดลนี้ และละเว้นฟิลด์ `thinking` และ `reasoning_effort` ขาออกตามข้อกำหนดของ Moonshot นอกจากนี้ยังละเว้นการกำหนดค่าการสุ่มแทนที่ (`temperature`, `top_p`, `n`, `presence_penalty`, `frequency_penalty`) ซึ่ง K2.7 กำหนดตายตัวตามค่าเริ่มต้นของผู้ให้บริการ Kimi K2.6 ยังคงเป็นค่าเริ่มต้นสำหรับการเริ่มต้นใช้งาน

## เริ่มต้นใช้งาน

ทั้ง Moonshot และ Kimi Coding เป็น Plugin ภายนอก โปรดติดตั้งหนึ่งรายการก่อนเริ่มต้นใช้งาน

<Tabs>
  <Tab title="Moonshot API">
    **เหมาะที่สุดสำหรับ:** โมเดล Kimi K2 ผ่าน Moonshot Open Platform

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Choose your endpoint region">
        | ตัวเลือกการยืนยันตัวตน | เอ็นด์พอยต์                     | ภูมิภาค       |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | นานาชาติ      |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | จีน           |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        หรือสำหรับเอ็นด์พอยต์จีน:

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
        ใช้ไดเรกทอรีสถานะแยกต่างหากเมื่อคุณต้องการตรวจสอบการเข้าถึงโมเดลและการติดตามค่าใช้จ่ายโดยไม่กระทบเซสชันปกติของคุณ:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        การตอบกลับแบบ JSON ควรรายงาน `provider: "moonshot"` และ `model: "kimi-k2.6"` รายการบทสนทนาของผู้ช่วยจะจัดเก็บการใช้โทเค็นที่ปรับให้อยู่ในรูปแบบมาตรฐาน พร้อมค่าใช้จ่ายโดยประมาณภายใต้ `usage.cost` เมื่อ Moonshot ส่งคืนข้อมูลเมตาการใช้งาน
      </Step>
    </Steps>

    ### ตัวอย่างการกำหนดค่า

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
    **เหมาะที่สุดสำหรับ:** งานที่เน้นโค้ดผ่านเอ็นด์พอยต์ Kimi Coding

    <Note>
    Kimi Coding ใช้คีย์ API และคำนำหน้าผู้ให้บริการ (`kimi/...`) ที่แตกต่างจาก Moonshot (`moonshot/...`) การอ้างอิงโมเดลที่เสถียรคือ `kimi/kimi-for-coding`; การอ้างอิงเดิม `kimi/kimi-code` และ `kimi/k2p5` ยังคงได้รับการยอมรับและจะถูกปรับเป็นรหัสโมเดลดังกล่าว
    </Note>

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
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

    ### ตัวอย่างการกำหนดค่า

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

## การค้นหาเว็บด้วย Kimi

Plugin Moonshot ยังลงทะเบียน **Kimi** เป็นผู้ให้บริการ `web_search` ซึ่งทำงานด้วยการค้นหาเว็บของ Moonshot

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    เลือก **Kimi** ในส่วนการค้นหาเว็บเพื่อจัดเก็บ `plugins.entries.moonshot.config.webSearch.*`

  </Step>
  <Step title="Configure the web search region and model">
    การตั้งค่าแบบโต้ตอบจะแจ้งให้ระบุ:

    | การตั้งค่า          | ตัวเลือก                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | ภูมิภาค API         | `https://api.moonshot.ai/v1` (นานาชาติ) หรือ `https://api.moonshot.cn/v1` (จีน) |
    | โมเดลค้นหาเว็บ      | ค่าเริ่มต้นคือ `kimi-k2.6`                                           |

  </Step>
</Steps>

การกำหนดค่าอยู่ภายใต้ `plugins.entries.moonshot.config.webSearch`:

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
    Kimi K2.7 Code ใช้การคิดแบบเนทีฟเสมอ Moonshot กำหนดให้ไคลเอนต์ละเว้นฟิลด์ `thinking` สำหรับโมเดลนี้ ดังนั้น OpenClaw จึงเปิดให้ใช้เฉพาะ `on` และเพิกเฉยต่อการตั้งค่า `off` ที่ล้าสมัย นอกจากนี้ K2.7 ยังกำหนดค่า `temperature`, `top_p`, `n`, `presence_penalty` และ `frequency_penalty` ไว้ตายตัว OpenClaw จึงละเว้นค่าที่กำหนดแทนที่สำหรับฟิลด์เหล่านี้

    โมเดล Moonshot Kimi อื่นรองรับการคิดแบบเนทีฟสองสถานะ:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    กำหนดค่าแยกตามโมเดลผ่าน `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw จับคู่ระดับ `/think` ขณะทำงานสำหรับโมเดลเหล่านั้นดังนี้:

    | ระดับ `/think`       | ลักษณะการทำงานของ Moonshot |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | ระดับใด ๆ ที่ไม่ใช่ปิด | `thinking.type=enabled`    |

    <Warning>
    เมื่อเปิดใช้งานการคิดของ Moonshot ค่า `tool_choice` ต้องเป็น `auto` หรือ `none` การเลือกเครื่องมือแบบระบุตายตัว (`type: "tool"` หรือ `type: "function"`) จะบังคับให้การคิดกลับเป็น `disabled` เพื่อให้เครื่องมือที่ขอยังคงทำงานได้ ส่วน `tool_choice: "required"` จะถูกปรับเป็น `auto` แทน ข้อนี้มีผลกับโมเดล Moonshot ทุกโมเดล ยกเว้น Kimi K2.7 Code ซึ่งไม่สามารถปิดโหมดการคิดได้ โดยค่า `tool_choice` ของโมเดลนี้จะถูกปรับเป็น `auto` เมื่อไม่เข้ากัน
    </Warning>

    Kimi K2.6 ยังรองรับฟิลด์ `thinking.keep` ที่เป็นตัวเลือก ซึ่งควบคุม
    การเก็บรักษา `reasoning_content` ข้ามหลายรอบ ตั้งค่าเป็น `"all"` เพื่อเก็บ
    กระบวนการให้เหตุผลทั้งหมดไว้ข้ามรอบ หรือไม่ระบุฟิลด์นี้ (หรือปล่อยเป็น `null`) เพื่อใช้กลยุทธ์
    เริ่มต้นของเซิร์ฟเวอร์ OpenClaw จะส่งต่อ `thinking.keep` เฉพาะสำหรับ
    `moonshot/kimi-k2.6` และจะตัดฟิลด์นี้ออกจากโมเดลอื่น โดยค่าเริ่มต้น Kimi K2.7 Code
    จะเก็บประวัติกระบวนการให้เหตุผลทั้งหมดไว้ ขณะที่ OpenClaw จะไม่ส่งฟิลด์
    `thinking` ทั้งฟิลด์

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

  <Accordion title="การปรับรหัสการเรียกใช้เครื่องมือให้ปลอดภัย">
    Moonshot Kimi ส่งรหัส tool_call แบบเนทีฟที่มีรูปแบบ `functions.<name>:<index>` OpenClaw จะคงการปรากฏครั้งแรกของรหัส Kimi แบบเนทีฟแต่ละรหัสไว้ และเขียนรหัสที่ซ้ำในครั้งต่อ ๆ ไปใหม่เป็นรหัส `call_*` แบบ OpenAI ที่กำหนดได้อย่างแน่นอน ผลลัพธ์ของเครื่องมือที่ตรงกันจะถูกแมปใหม่ด้วยรหัสเดียวกัน เพื่อให้การเล่นซ้ำยังคงมีรหัสไม่ซ้ำกันโดยไม่ตัดรหัสแบบเนทีฟรายการแรกของ Kimi ออก ลักษณะการทำงานนี้เชื่อมต่ออยู่ในผู้ให้บริการ Moonshot ที่รวมมาให้ และไม่ใช่การตั้งค่าที่ผู้ใช้กำหนดได้
  </Accordion>

  <Accordion title="ความเข้ากันได้ของข้อมูลการใช้งานแบบสตรีม">
    ปลายทาง Moonshot แบบเนทีฟ (`https://api.moonshot.ai/v1` และ
    `https://api.moonshot.cn/v1`) ประกาศว่ารองรับข้อมูลการใช้งานแบบสตรีม
    OpenClaw พิจารณาคุณสมบัตินี้จากโฮสต์ของปลายทาง ไม่ใช่รหัสผู้ให้บริการ ดังนั้นรหัส
    ผู้ให้บริการแบบกำหนดเองที่ชี้ไปยังโฮสต์ Moonshot แบบเนทีฟเดียวกันจะสืบทอดลักษณะการทำงาน
    ของข้อมูลการใช้งานแบบสตรีมเดียวกัน

    เมื่อใช้ราคาของ K2.6 ในแค็ตตาล็อก ข้อมูลการใช้งานแบบสตรีมที่มีโทเค็นอินพุต เอาต์พุต
    และการอ่านแคช จะถูกแปลงเป็นค่าใช้จ่ายโดยประมาณในสกุล USD ภายในระบบสำหรับ
    `/status`, `/usage full`, `/usage cost` และการคำนวณการใช้งานของเซสชัน
    ที่อ้างอิงจากบันทึกการสนทนาด้วย

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงปลายทางและการอ้างอิงโมเดล">
    | ผู้ให้บริการ   | คำนำหน้าการอ้างอิงโมเดล | ปลายทาง                      | ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | ปลายทาง Kimi Coding           | `KIMI_API_KEY`      |
    | การค้นหาเว็บ | ไม่มี              | เหมือนกับภูมิภาคของ Moonshot API    | `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` |

    - การค้นหาเว็บของ Kimi ใช้ `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` และมีค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1` พร้อมโมเดล `kimi-k2.6`
    - เขียนทับข้อมูลเมตาด้านราคาและบริบทใน `models.providers` หากจำเป็น
    - หาก Moonshot เผยแพร่ขีดจำกัดบริบทของโมเดลที่แตกต่างออกไป ให้ปรับ `contextWindow` ให้สอดคล้องกัน

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การค้นหาเว็บ" href="/th/tools/web" icon="magnifying-glass">
    การกำหนดค่าผู้ให้บริการค้นหาเว็บ รวมถึง Kimi
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็มสำหรับผู้ให้บริการ โมเดล และ Plugin
  </Card>
  <Card title="แพลตฟอร์มเปิด Moonshot" href="https://platform.moonshot.ai" icon="globe">
    การจัดการคีย์ Moonshot API และเอกสารประกอบ
  </Card>
</CardGroup>
