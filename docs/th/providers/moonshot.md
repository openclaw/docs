---
read_when:
    - คุณต้องการตั้งค่า Moonshot Kimi K3/K2 (Moonshot Open Platform) เทียบกับ Kimi Coding
    - คุณจำเป็นต้องทำความเข้าใจ endpoint, คีย์ และ model ref ที่แยกจากกัน
    - คุณต้องการการกำหนดค่าที่คัดลอกและวางได้สำหรับผู้ให้บริการรายใดรายหนึ่ง
summary: กำหนดค่าโมเดล Moonshot Kimi เทียบกับ Kimi Coding (ผู้ให้บริการและคีย์แยกกัน)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-19T07:28:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a9c60d2ec13c1de48e037b6cfe7b35b2133328ba852143134521e9d56edbba8e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot ให้บริการ Kimi API ผ่านปลายทางที่เข้ากันได้กับ OpenAI เลือก
`moonshot/kimi-k3` สำหรับ Kimi K3 ใช้ค่าเริ่มต้นในการเริ่มต้นใช้งาน
`moonshot/kimi-k2.6` ต่อไป หรือใช้ `kimi/kimi-for-coding` สำหรับ Kimi Coding

<Warning>
Moonshot และ Kimi Coding เป็น **ผู้ให้บริการแยกกัน** โดยแต่ละรายจัดส่งเป็น Plugin ภายนอกแยกต่างหาก คีย์ใช้แทนกันไม่ได้ ปลายทางแตกต่างกัน และการอ้างอิงโมเดลแตกต่างกัน (`moonshot/...` เทียบกับ `kimi/...`)
</Warning>

## แค็ตตาล็อกโมเดลในตัว

[//]: # "moonshot-kimi-k2-ids:start"

| การอ้างอิงโมเดล                           | ชื่อ                     | การใช้เหตุผล  | อินพุต       | บริบท   | เอาต์พุตสูงสุด |
| ----------------------------------- | ------------------------ | ---------- | ----------- | --------- | ---------- |
| `moonshot/kimi-k2.6`                | Kimi K2.6                | ไม่         | ข้อความ, รูปภาพ | 262,144   | 262,144    |
| `moonshot/kimi-k3`                  | Kimi K3                  | สูงสุดเสมอ | ข้อความ, รูปภาพ | 1,048,576 | 1,048,576  |
| `moonshot/kimi-k2.7-code`           | Kimi K2.7 Code           | เปิดเสมอ  | ข้อความ, รูปภาพ | 262,144   | 262,144    |
| `moonshot/kimi-k2.7-code-highspeed` | Kimi K2.7 Code HighSpeed | เปิดเสมอ  | ข้อความ, รูปภาพ | 262,144   | 262,144    |
| `moonshot/kimi-k2.5`                | Kimi K2.5                | ไม่         | ข้อความ, รูปภาพ | 262,144   | 262,144    |

[//]: # "moonshot-kimi-k2-ids:end"

ค่าประมาณต้นทุนในแค็ตตาล็อกใช้อัตราแบบจ่ายตามการใช้งานที่ Moonshot เผยแพร่ ตรวจสอบ
หน้าของผู้ให้บริการแบบสดสำหรับ [Kimi K3](https://platform.kimi.ai/docs/pricing/chat-k3),
[Kimi K2.7 Code](https://platform.kimi.ai/docs/pricing/chat-k27-code),
[Kimi K2.6](https://platform.kimi.ai/docs/pricing/chat-k26) และ
[Kimi K2.5](https://platform.kimi.ai/docs/pricing/chat-k25) ก่อนตัดสินใจ
ด้านต้นทุน

Kimi K3 ใช้เหตุผลที่ระดับ `reasoning_effort: "max"` เสมอ OpenClaw เปิดให้ใช้เฉพาะ
`/think max` ละเว้นฟิลด์ `thinking` ที่มีเฉพาะใน K2 และนำการกำหนดค่าการสุ่ม
(`temperature`, `top_p`, `n`, `presence_penalty` และ
`frequency_penalty`) ที่ K3 กำหนดตายตัวตามค่าเริ่มต้นของผู้ให้บริการออก Kimi K2.7 Code ยัง
ใช้การคิดแบบเนทีฟเสมอ แต่กำหนดให้ละเว้นทั้ง `thinking` และ
`reasoning_effort`; รุ่น HighSpeed ใช้สัญญาเดียวกัน
Kimi K2.6 ยังคงเป็นค่าเริ่มต้นในการเริ่มต้นใช้งาน
ดู[คู่มือเริ่มต้นฉบับย่อของ Kimi K3](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart) จาก Moonshot

## เริ่มต้นใช้งาน

ทั้ง Moonshot และ Kimi Coding เป็น Plugin ภายนอก โปรดติดตั้งหนึ่งรายการก่อน
เริ่มต้นใช้งาน

<Tabs>
  <Tab title="Moonshot API">
    **เหมาะที่สุดสำหรับ:** โมเดล Kimi K3 และ K2 ผ่าน Moonshot Open Platform

    <Steps>
      <Step title="ติดตั้ง Plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="เลือกภูมิภาคของปลายทาง">
        | ตัวเลือกการยืนยันตัวตน            | ปลายทาง                       | ภูมิภาค        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | นานาชาติ |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | จีน         |
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        หรือสำหรับปลายทางในจีน:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="ตั้ง Kimi K3 เป็นโมเดลเริ่มต้น">
        การเริ่มต้นใช้งานจะคง Kimi K2.6 เป็นค่าเริ่มต้นแรก เปลี่ยนอย่างชัดเจน
        เมื่อต้องการใช้ Kimi K3:

        ```bash
        openclaw models set moonshot/kimi-k3
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="เรียกใช้การทดสอบควันแบบสด">
        ใช้ไดเรกทอรีสถานะที่แยกต่างหากเมื่อต้องการตรวจสอบการเข้าถึงโมเดลและการติดตาม
        ต้นทุนโดยไม่กระทบเซสชันปกติ:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking max \
          --json
        ```

        การตอบกลับ JSON ควรรายงาน `provider: "moonshot"` และ
        `model: "kimi-k3"` รายการทรานสคริปต์ของผู้ช่วยจะจัดเก็บการใช้งาน
        โทเค็นที่ปรับให้อยู่ในรูปแบบมาตรฐาน พร้อมต้นทุนโดยประมาณภายใต้ `usage.cost` เมื่อ Moonshot ส่งคืน
        ข้อมูลเมตาการใช้งาน
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
            "moonshot/kimi-k3": { alias: "Kimi K3" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.7-code-highspeed": { alias: "Kimi K2.7 Code HighSpeed" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
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
                id: "kimi-k3",
                name: "Kimi K3",
                reasoning: true,
                thinkingLevelMap: {
                  off: null,
                  minimal: null,
                  low: null,
                  medium: null,
                  high: null,
                  xhigh: "max",
                  max: "max",
                },
                input: ["text", "image"],
                cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
                contextWindow: 1048576,
                maxTokens: 1048576,
                compat: {
                  supportsReasoningEffort: true,
                  supportedReasoningEfforts: ["max"],
                },
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
                id: "kimi-k2.7-code-highspeed",
                name: "Kimi K2.7 Code HighSpeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 },
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
    Kimi Coding ใช้คีย์ API และคำนำหน้าผู้ให้บริการ (`kimi/...`) ที่แตกต่างจาก Moonshot (`moonshot/...`) การอ้างอิงปัจจุบันคือ `kimi/k3` สำหรับบริบท 256K, `kimi/k3[1m]` สำหรับระดับ 1M, `kimi/kimi-for-coding` และ `kimi/kimi-for-coding-highspeed` การอ้างอิงแบบเดิม `kimi/kimi-code` และ `kimi/k2p5` ยังคงได้รับการยอมรับและปรับให้อยู่ในรูปแบบ `kimi/kimi-for-coding`
    </Note>

    บริการเขียนโค้ดยอมรับทั้งไคลเอนต์
    `https://api.kimi.com/coding/v1` ที่เข้ากันได้กับ OpenAI และไคลเอนต์
    `https://api.kimi.com/coding/` ที่เข้ากันได้กับ Anthropic Plugin นี้ใช้ Anthropic Messages
    สร้างคีย์สมาชิกใน
    [Kimi Code Console](https://www.kimi.com/code/console); ราคาสมาชิกปัจจุบัน
    อยู่ใน[หน้าราคาของ Kimi](https://www.kimi.com/membership/pricing)

    <Steps>
      <Step title="ติดตั้ง Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="ตั้งโมเดลเริ่มต้น">
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

    Kimi Code K3 ใช้การคิดเชิงลึกที่ `max` เป็นค่าเริ่มต้น `/think off` จะส่ง
    `thinking.type: "disabled"`; `/think max` จะส่งคำขอ
    การคิดแบบปรับตัวของ K3 ด้วยความพยายามสูงสุด ระดับการคิดที่ต่ำกว่าและล้าสมัยจะถูกปรับเป็น
    ระดับ `max` ที่รองรับ โมเดล 1M ต้องใช้สมาชิก Kimi ระดับ Allegretto ขึ้นไป
    ใช้ `kimi/k3` สำหรับ Moderato

    ดู[ตารางโมเดล Kimi Code](https://www.kimi.com/code/docs/en/kimi-code/models.html) อย่างเป็นทางการสำหรับความพร้อมใช้งานในแพ็กเกจปัจจุบัน

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
  <Step title="เรียกใช้การตั้งค่าการค้นหาเว็บแบบโต้ตอบ">
    ```bash
    openclaw configure --section web
    ```

    เลือก **Kimi** ในส่วนการค้นหาเว็บเพื่อจัดเก็บ
    `plugins.entries.moonshot.config.webSearch.*`

  </Step>
  <Step title="กำหนดค่าภูมิภาคและโมเดลสำหรับการค้นหาเว็บ">
    การตั้งค่าแบบโต้ตอบจะแจ้งให้ระบุ:

    | การตั้งค่า             | ตัวเลือก                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | ภูมิภาค API          | `https://api.moonshot.ai/v1` (นานาชาติ) หรือ `https://api.moonshot.cn/v1` (จีน) |
    | โมเดลค้นหาเว็บ    | ค่าเริ่มต้นคือ `kimi-k2.6`                                             |

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

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมดการคิดแบบเนทีฟ">
    Moonshot API Kimi K3 ใช้เหตุผลด้วยความพยายามสูงสุดเสมอ OpenClaw เปิดให้ใช้เฉพาะ
    `/think max` ส่ง `reasoning_effort: "max"` และละเว้นการตั้งค่าระดับที่ต่ำกว่าซึ่งล้าสมัยหรือ
    `off`

    Kimi Code K3 เปิดใช้ `/think off|max` ปลายทางที่เข้ากันได้กับ Anthropic
    รับ `thinking.type: "disabled"` เพื่อปิด หรือใช้การคิดแบบปรับได้พร้อม
    `output_config.effort: "max"` สำหรับระดับสูงสุด ซึ่งใช้กับทั้ง `kimi/k3` และ
    `kimi/k3[1m]`
    Moonshot API K3 รองรับ `auto`, `none`, `required` และการเลือกเครื่องมือแบบตรึง
    ดังนั้น OpenClaw จึงคง `tool_choice` ที่ร้องขอไว้ สำหรับการใช้เครื่องมือแบบหลายรอบ
    OpenClaw จะคงเนื้อหาการให้เหตุผลของผู้ช่วยที่จำเป็นตาม
    สัญญาการเล่นซ้ำของ Moonshot

    Kimi K2.7 Code ใช้การคิดแบบเนทีฟเสมอ Moonshot กำหนดให้ไคลเอนต์
    ไม่ต้องส่งฟิลด์ `thinking` สำหรับโมเดลนี้ ดังนั้น OpenClaw จึงเปิดใช้เฉพาะ `on` และ
    ไม่สนใจการตั้งค่า `off` ที่ล้าสมัย นอกจากนี้ K2.7 ยังกำหนดค่า `temperature`, `top_p`, `n`,
    `presence_penalty` และ `frequency_penalty` ไว้ตายตัว โดย OpenClaw จะไม่ส่ง
    ค่าที่กำหนดเพื่อเขียนทับฟิลด์เหล่านั้น

    โมเดล Moonshot Kimi อื่นๆ รองรับการคิดแบบเนทีฟชนิดไบนารี:

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

    OpenClaw จับคู่ระดับ `/think` ขณะรันไทม์สำหรับโมเดลเหล่านั้นดังนี้:

    | ระดับ `/think`       | ลักษณะการทำงานของ Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | ระดับใดๆ ที่ไม่ใช่ปิด    | `thinking.type=enabled`    |

    <Warning>
    เมื่อเปิดใช้การคิดของ Moonshot K2 ค่า `tool_choice` ต้องเป็น `auto` หรือ `none` การเลือกเครื่องมือแบบตรึง (`type: "tool"` หรือ `type: "function"`) จะบังคับให้การคิดกลับเป็น `disabled` แทน เพื่อให้เครื่องมือที่ร้องขอยังคงทำงาน ส่วน `tool_choice: "required"` จะถูกปรับให้เป็น `auto` แทน Kimi K2.7 Code ไม่สามารถปิดการคิดได้ ดังนั้น `tool_choice` ที่เข้ากันไม่ได้จะถูกปรับให้เป็น `auto` Kimi K3 ใช้สัญญาระดับความเข้มข้นในการให้เหตุผลแยกต่างหากและคงการเลือกเครื่องมือที่รองรับไว้
    </Warning>

    Kimi K2.6 ยังรับฟิลด์ `thinking.keep` ซึ่งเป็นตัวเลือกสำหรับควบคุม
    การเก็บรักษา `reasoning_content` แบบหลายรอบ ตั้งค่าเป็น `"all"` เพื่อเก็บ
    การให้เหตุผลทั้งหมดข้ามรอบ หรือไม่ต้องระบุ (หรือปล่อยเป็น `null`) เพื่อใช้กลยุทธ์
    เริ่มต้นของเซิร์ฟเวอร์ OpenClaw จะส่งต่อ `thinking.keep` เฉพาะสำหรับ
    `moonshot/kimi-k2.6` และจะตัดออกจากโมเดลอื่น Kimi K2.7 Code
    จะเก็บประวัติการให้เหตุผลทั้งหมดไว้โดยค่าเริ่มต้น ขณะที่ OpenClaw จะไม่ส่งฟิลด์
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

  <Accordion title="การปรับค่า id ของการเรียกเครื่องมือให้ปลอดภัย">
    Moonshot Kimi ให้บริการ id ของ tool_call แบบเนทีฟที่มีรูปแบบเช่น `functions.<name>:<index>` OpenClaw จะคงการปรากฏครั้งแรกของแต่ละ id แบบเนทีฟของ Kimi และเขียนรายการซ้ำในภายหลังใหม่เป็น id แบบ `call_*` ตามรูปแบบ OpenAI ที่กำหนดซ้ำได้ ผลลัพธ์ของเครื่องมือที่ตรงกันจะถูกจับคู่ใหม่ด้วย id เดียวกัน เพื่อให้การเล่นซ้ำยังคงไม่ซ้ำกันโดยไม่ตัด id แบบเนทีฟรายการแรกของ Kimi ออก ลักษณะการทำงานนี้เชื่อมต่ออยู่ในผู้ให้บริการ Moonshot ที่รวมมาให้ และไม่ใช่การตั้งค่าที่ผู้ใช้กำหนดได้
  </Accordion>

  <Accordion title="ความเข้ากันได้ของข้อมูลการใช้งานแบบสตรีม">
    ปลายทาง Moonshot แบบเนทีฟ (`https://api.moonshot.ai/v1` และ
    `https://api.moonshot.cn/v1`) ระบุว่ารองรับข้อมูลการใช้งานแบบสตรีม
    OpenClaw พิจารณาจากโฮสต์ของปลายทาง ไม่ใช่ id ของผู้ให้บริการ ดังนั้น id
    ผู้ให้บริการแบบกำหนดเองที่ชี้ไปยังโฮสต์ Moonshot แบบเนทีฟเดียวกันจะได้รับ
    ลักษณะการทำงานของข้อมูลการใช้งานแบบสตรีมเดียวกัน

    เมื่อใช้ราคาของ K2.6 ในแค็ตตาล็อก ข้อมูลการใช้งานแบบสตรีมที่รวมโทเค็นอินพุต เอาต์พุต
    และการอ่านแคช จะถูกแปลงเป็นค่าใช้จ่ายโดยประมาณในหน่วย USD ภายในเครื่องสำหรับ
    `/status`, `/usage full`, `/usage cost` และการบันทึกบัญชีเซสชัน
    ที่อ้างอิงจากทรานสคริปต์ด้วย

  </Accordion>

  <Accordion title="ข้อมูลอ้างอิงปลายทางและการอ้างอิงโมเดล">
    | ผู้ให้บริการ   | คำนำหน้าการอ้างอิงโมเดล | ปลายทาง                      | ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | ปลายทาง Kimi Coding           | `KIMI_API_KEY`      |
    | การค้นหาเว็บ | ไม่มี              | เหมือนกับภูมิภาคของ Moonshot API    | `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` |

    - การค้นหาเว็บของ Kimi ใช้ `KIMI_API_KEY` หรือ `MOONSHOT_API_KEY` และมีค่าเริ่มต้นเป็น `https://api.moonshot.ai/v1` พร้อมโมเดล `kimi-k2.6`
    - เขียนทับข้อมูลราคาและเมทาดาทาบริบทใน `models.providers` หากจำเป็น
    - หาก Moonshot เผยแพร่ขีดจำกัดบริบทที่ต่างออกไปสำหรับโมเดล ให้ปรับ `contextWindow` ให้สอดคล้องกัน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การค้นหาเว็บ" href="/th/tools/web" icon="magnifying-glass">
    การกำหนดค่าผู้ให้บริการค้นหาเว็บ รวมถึง Kimi
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าแบบเต็มสำหรับผู้ให้บริการ โมเดล และ Plugin
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    การจัดการคีย์ Moonshot API และเอกสารประกอบ
  </Card>
</CardGroup>
