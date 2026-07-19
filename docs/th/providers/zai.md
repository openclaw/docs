---
read_when:
    - คุณต้องการใช้โมเดล Z.AI / GLM ใน OpenClaw
    - คุณต้องตั้งค่า ZAI_API_KEY แบบง่ายๆ
summary: ใช้ Z.AI (โมเดล GLM) กับ OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-19T07:33:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ca3e7ef743e908550f4d96ba6f78167e38cabd15b14044683b02493ebbf3025
    source_path: providers/zai.md
    workflow: 16
---

Z.AI คือแพลตฟอร์ม API สำหรับโมเดล **GLM** โดยให้บริการ REST API สำหรับ GLM และ
ใช้คีย์ API สำหรับการยืนยันตัวตน สร้างคีย์ API ในคอนโซล Z.AI
OpenClaw ใช้ผู้ให้บริการ `zai` ร่วมกับคีย์ API ของ Z.AI

| คุณสมบัติ | ค่า                                        |
| -------- | -------------------------------------------- |
| ผู้ให้บริการ | `zai`                                        |
| แพ็กเกจ  | `@openclaw/zai-provider`                     |
| การยืนยันตัวตน     | `ZAI_API_KEY` (นามแฝงแบบเดิม: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (การยืนยันตัวตนแบบ Bearer)          |

## โมเดล GLM

GLM เป็นตระกูลโมเดล ไม่ใช่ผู้ให้บริการแยกต่างหาก ใน OpenClaw โมเดล GLM ใช้
การอ้างอิง เช่น `zai/glm-5.2`: ผู้ให้บริการ `zai`, รหัสโมเดล `glm-5.2`

## เริ่มต้นใช้งาน

ติดตั้ง Plugin ของผู้ให้บริการก่อน:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="ตรวจหาปลายทางอัตโนมัติ">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ส่วนใหญ่ OpenClaw จะตรวจสอบปลายทาง Z.AI ที่รองรับด้วยคีย์ API และใช้ URL ฐานที่ถูกต้องโดยอัตโนมัติ

    <Steps>
      <Step title="เรียกใช้การเริ่มต้นระบบ">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลอยู่ในรายการ">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="ระบุปลายทางตามภูมิภาคอย่างชัดเจน">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ที่ต้องการบังคับใช้พื้นผิว API ของ Coding Plan หรือ API ทั่วไปที่ระบุ

    <Steps>
      <Step title="เลือกตัวเลือกการเริ่มต้นระบบที่ถูกต้อง">
        ```bash
        # Coding Plan สากล (แนะนำสำหรับผู้ใช้ Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (ภูมิภาคจีน)
        openclaw onboard --auth-choice zai-coding-cn

        # API ทั่วไป
        openclaw onboard --auth-choice zai-global

        # API ทั่วไป CN (ภูมิภาคจีน)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลอยู่ในรายการ">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### เอนด์พอยต์

| ตัวเลือกการเริ่มต้นใช้งาน   | URL ฐาน                                      | โมเดลเริ่มต้น |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

Z.AI ยังเผยแพร่ URL ฐานของ Coding Plan ที่เข้ากันได้กับ Anthropic
`https://api.z.ai/api/anthropic` ตัวเลือก Z.AI ของ OpenClaw ใช้เอนด์พอยต์
OpenAI Chat Completions ที่ระบุไว้ข้างต้น ส่วน URL ของ Anthropic มีไว้สำหรับไคลเอ็นต์ที่
สื่อสารด้วย Anthropic Messages โดยตรง

`zai-api-key` ตรวจหาหนึ่งในสี่ตัวเลือกนี้โดยอัตโนมัติ ด้วยการทดสอบคีย์ของคุณกับ API
chat-completions ของแต่ละเอนด์พอยต์ โดยตรวจสอบเอนด์พอยต์ทั่วไป (`zai-global`,
จากนั้น `zai-cn`) ก่อนเอนด์พอยต์ Coding Plan (`zai-coding-global` แล้วจึง
`zai-coding-cn`) และหยุดที่เอนด์พอยต์แรกที่ยอมรับคำขอ
ใช้ `--auth-choice` แบบระบุชัดเจนเพื่อบังคับใช้เอนด์พอยต์ Coding Plan หากคีย์ของคุณ
ใช้งานได้กับทั้งสองแบบ

## ขีดจำกัดอัตราและภาวะโหลดเกิน

Z.AI ระบุว่า Coding Plan และเครื่องมือเอเจนต์อเนกประสงค์เป็นบริการที่
บริหารจัดการตามขีดความสามารถ ในเอกสารของ Z.AI ระบุว่า:

- [เครื่องมือเอเจนต์อเนกประสงค์](https://docs.z.ai/devpack/tool/others)
  รวมถึง OpenClaw ให้บริการตามขีดความสามารถที่มีอยู่โดยไม่รับประกัน ในช่วงที่มีโหลดการอนุมานสูง
  ซึ่งโดยทั่วไปอยู่ราว 2-6 PM ตามเวลาสิงคโปร์ คำขอบางรายการอาจเผชิญ
  ขีดจำกัดอัตราชั่วคราว
- [ขีดจำกัดอัตราและจำนวนคำขอพร้อมกันของ Coding Plan](https://docs.z.ai/devpack/usage-policy)
  ผูกกับระดับของแผนและอาจปรับเปลี่ยนแบบไดนามิกตามความพร้อมใช้งานของทรัพยากร
  ช่วงนอกเวลาเร่งด่วนอาจรองรับคำขอพร้อมกันได้มากขึ้น
- [รหัสข้อผิดพลาด API `1302`](https://docs.z.ai/api-reference/api-code) หมายถึง "คำขอถึง
  ขีดจำกัดอัตราแล้ว" รหัสข้อผิดพลาด API `1305` หมายถึง "บริการอาจมี
  โหลดเกินชั่วคราว โปรดลองอีกครั้งภายหลัง"

หากพบการตอบกลับ `429` หรือ `1305` ชั่วคราวในช่วงที่มีการใช้งานหนาแน่น ให้รอแล้ว
ลองส่งคำขออีกครั้ง หากเกิดความล้มเหลวซ้ำได้นอกช่วงเวลาใช้งานสูงสุด หรือเกิดขึ้นเฉพาะ
กับ endpoint, โมเดล หรือรูปแบบคำขอใดรูปแบบหนึ่ง ให้ตรวจสอบ endpoint
และโมเดลที่กำหนดค่าไว้ก่อน:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

คีย์ Coding Plan ควรใช้ endpoint ของ Coding Plan เช่น
`https://api.z.ai/api/coding/paas/v4`; คีย์ API ทั่วไปควรใช้ endpoint ของ API
ทั่วไป เช่น `https://api.z.ai/api/paas/v4` ความล้มเหลวที่เกิดขึ้นอย่างต่อเนื่องกับ
คีย์และ endpoint เดิมอาจบ่งชี้ว่าผู้ให้บริการปฏิเสธคำขอหรือมีข้อจำกัดของแพ็กเกจ
ไม่ใช่การจำกัดอัตราตามปกติเนื่องจากภาระงานสูงสุด

## ตัวอย่างการกำหนดค่า

<Tip>
`zai-api-key` ช่วยให้ OpenClaw ตรวจหา endpoint ของ Z.AI ที่ตรงกับคีย์และ
ใช้ URL ฐานที่ถูกต้องโดยอัตโนมัติ ใช้ตัวเลือกภูมิภาคแบบระบุชัดเจนเมื่อต้องการ
บังคับใช้พื้นผิว Coding Plan หรือ API ทั่วไปที่เฉพาะเจาะจง
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 ใช้ endpoint ของ Coding Plan
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## แค็ตตาล็อกในตัว

Plugin ผู้ให้บริการ `zai` จัดส่งแค็ตตาล็อกไว้ในแมนิเฟสต์ของ Plugin ดังนั้นการแสดงรายการแบบอ่านอย่างเดียว
จึงสามารถแสดงแถว GLM ที่รู้จักได้โดยไม่ต้องโหลดรันไทม์ของผู้ให้บริการ:

```bash
openclaw models list --all --provider zai
```

ปัจจุบันแค็ตตาล็อกที่อ้างอิงจากแมนิเฟสต์ประกอบด้วย:

| การอ้างอิงโมเดล            | หมายเหตุ                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | ค่าเริ่มต้นของ Coding Plan; บริบท 1M |
| `zai/glm-5.1`        | ค่าเริ่มต้นของ API ทั่วไป             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

ข้อมูลเมตาต้นทุนโทเค็นของแค็ตตาล็อกเป็นไปตาม
[ราคาแบบจ่ายตามการใช้งาน](https://docs.z.ai/guides/overview/pricing) ปัจจุบันของ Z.AI การสมัครใช้บริการ Coding Plan
ใช้โควตาของแผนแทนการเรียกเก็บเงินต่อโทเค็น โปรดดู
[หน้าการสมัครใช้บริการ](https://z.ai/subscribe) ปัจจุบันสำหรับราคาและความพร้อมให้บริการของแผน

<Tip>
โมเดล GLM พร้อมใช้งานในรูปแบบ `zai/<model>` (ตัวอย่าง: `zai/glm-5`)
</Tip>

<Note>
การตั้งค่า Coding Plan ใช้ `zai/glm-5.2` เป็นค่าเริ่มต้น ส่วนการตั้งค่า API ทั่วไปยังคงใช้
`zai/glm-5.1` บนปลายทางของ Coding Plan การตรวจหาอัตโนมัติจะถอยกลับไปใช้
`glm-5.1` แล้วจึงใช้ `glm-4.7` เมื่อคีย์/แผนไม่เปิดให้ใช้ GLM-5.2 เวอร์ชันและ
ความพร้อมให้บริการของ GLM อาจเปลี่ยนแปลงได้ ให้เรียกใช้ `openclaw models list --all --provider zai`
เพื่อดูแค็ตตาล็อกที่เวอร์ชันซึ่งติดตั้งอยู่รู้จัก
</Note>

## ระดับการคิด

<Tabs>
  <Tab title="GLM-5.2">
    ช่วงเต็ม: `off`, `low`, `high`, `max` (ค่าเริ่มต้น `off`) OpenClaw แมป
    `low` และ `high` ไปยังระดับความพยายามในการให้เหตุผล `high` ของ Z.AI และแมป `max` ไปยัง
    ระดับความพยายาม `max` ของ Z.AI ผ่าน `reasoning_effort` ในเพย์โหลดคำขอ
  </Tab>
  <Tab title="โมเดล GLM อื่นๆ">
    สลับได้เพียงสองสถานะ: `off` และ `low` (แสดงเป็น `on` ในตัวเลือก) โดยมีค่าเริ่มต้นเป็น
    `off` การตั้งค่าการคิดเป็น `off` จะส่ง `thinking: { type: "disabled" }`;
    ระดับอื่นจะไม่แก้ไขเพย์โหลดคำขอ (ใช้พฤติกรรมการให้เหตุผลเริ่มต้นของ
    Z.AI)
  </Tab>
</Tabs>

การตั้งค่าการคิดเป็น `off` ช่วยหลีกเลี่ยงการตอบกลับที่ใช้โควตาเอาต์พุตไปกับ
`reasoning_content` ก่อนข้อความที่มองเห็นได้

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การส่งต่อเพื่อแก้ไขโมเดล GLM-5 ที่ไม่รู้จัก">
    ID `glm-5*` ที่ไม่รู้จักยังคงได้รับการแก้ไขแบบส่งต่อในเส้นทางของผู้ให้บริการโดย
    สังเคราะห์ข้อมูลเมตาที่ผู้ให้บริการเป็นเจ้าของจากเทมเพลต `glm-4.7` เมื่อ ID
    ตรงกับรูปแบบตระกูล GLM-5 ปัจจุบัน
  </Accordion>

  <Accordion title="การสตรีมการเรียกใช้เครื่องมือ">
    `tool_stream` เปิดใช้งานเป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือของ Z.AI หากต้องการปิดใช้งาน:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การเก็บรักษาการคิด">
    การเก็บรักษาการคิดต้องเลือกเปิดใช้งาน เนื่องจาก Z.AI กำหนดให้เล่นซ้ำ
    `reasoning_content` ในอดีตทั้งหมด ซึ่งเพิ่มจำนวนโทเค็นพรอมต์ เปิดใช้งาน
    แยกตามโมเดล:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    เมื่อเปิดใช้งานและเปิดการคิดอยู่ OpenClaw จะส่ง
    `thinking: { type: "enabled", clear_thinking: false }` และเล่นซ้ำ
    `reasoning_content` ก่อนหน้าสำหรับทรานสคริปต์เดียวกันที่เข้ากันได้กับ OpenAI คีย์พารามิเตอร์แบบ snake_case
    `preserve_thinking` ใช้เป็นชื่อแฝงได้

    ผู้ใช้ขั้นสูงยังคงสามารถแทนที่เพย์โหลดของผู้ให้บริการอย่างเจาะจงได้ด้วย
    `params.extra_body.thinking`

  </Accordion>

  <Accordion title="ความเข้าใจรูปภาพ">
    Plugin Z.AI ลงทะเบียนความสามารถในการทำความเข้าใจรูปภาพ

    | คุณสมบัติ      | ค่า       |
    | ------------- | ----------- |
    | โมเดล         | `glm-4.6v`  |

    ระบบจะแก้ไขความสามารถในการทำความเข้าใจรูปภาพโดยอัตโนมัติจากการตรวจสอบสิทธิ์ Z.AI ที่กำหนดค่าไว้ โดยไม่
    ต้องกำหนดค่าเพิ่มเติม

  </Accordion>

  <Accordion title="รายละเอียดการตรวจสอบสิทธิ์">
    - Z.AI ใช้การตรวจสอบสิทธิ์แบบ Bearer ด้วยคีย์ API ของคุณ
    - ตัวเลือกการเริ่มต้นใช้งาน `zai-api-key` จะตรวจหาปลายทาง Z.AI ที่ตรงกันโดยอัตโนมัติ ด้วยการตรวจสอบปลายทางที่รองรับโดยใช้คีย์ของคุณ
    - ใช้ตัวเลือกภูมิภาคแบบระบุชัดเจน (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) เมื่อต้องการบังคับใช้พื้นผิว API ที่เฉพาะเจาะจง
    - ตัวแปรสภาพแวดล้อมแบบเดิม `Z_AI_API_KEY` ยังคงรองรับอยู่ OpenClaw จะคัดลอกไปยัง `ZAI_API_KEY` เมื่อเริ่มทำงาน หากยังไม่ได้ตั้งค่า `ZAI_API_KEY`

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่า OpenClaw ฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการและโมเดล
  </Card>
</CardGroup>
