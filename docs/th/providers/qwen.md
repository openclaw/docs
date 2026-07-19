---
read_when:
    - คุณต้องการใช้ Qwen กับ OpenClaw
    - คุณมีการสมัครสมาชิก Alibaba Cloud Token Plan
summary: ใช้ Qwen Cloud ผ่าน Plugin ของ OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-19T07:59:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74f94a35631dcdf8c9afc12e86d7a9d6b51a359411ba36f8820f8b1e7c03a27a
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud เป็น Plugin ผู้ให้บริการภายนอกอย่างเป็นทางการของ OpenClaw โดยมีรหัสมาตรฐานเป็น `qwen` รองรับปลายทาง Qwen Cloud / Alibaba DashScope ทั้งแบบ Standard และ Coding Plan เปิดให้ใช้ Token Plan ผ่าน `qwen-token-plan` คง `modelstudio` ไว้เป็นนามแฝงเพื่อความเข้ากันได้ และเป็นเจ้าของรหัสผู้ให้บริการแบบกำหนดเอง `bailian-token-plan` ที่ระบุไว้ในเอกสารของ Alibaba โดยอิสระ

| คุณสมบัติ               | ค่า                                      |
| ---------------------- | ------------------------------------------ |
| ผู้ให้บริการ               | `qwen`                                     |
| ผู้ให้บริการ Token Plan    | `qwen-token-plan`                          |
| ตัวแปรสภาพแวดล้อมที่แนะนำ      | `QWEN_API_KEY`                             |
| ตัวแปรสภาพแวดล้อมของ Token Plan | `QWEN_TOKEN_PLAN_API_KEY`                  |
| รองรับเพิ่มเติม (เพื่อความเข้ากันได้) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| รูปแบบ API              | เข้ากันได้กับ OpenAI                          |

<Tip>
`qwen3.7-plus` และ `qwen3.6-plus` ใช้ได้กับปลายทาง Coding Plan และ Standard
สำหรับ `qwen3.7-max` หรือ `qwen3.6-flash` ให้ใช้ปลายทาง **Standard (จ่ายตามการใช้งาน)**
</Tip>

## ติดตั้ง Plugin

`qwen` เผยแพร่เป็น Plugin ภายนอกอย่างเป็นทางการและไม่ได้รวมมากับแกนหลัก ติดตั้งแล้วเริ่ม Gateway ใหม่:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

เลือกประเภทแผนแล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Coding Plan (การสมัครสมาชิก)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบสมัครสมาชิกผ่าน Qwen Coding Plan

    <Steps>
      <Step title="รับคีย์ API">
        สร้างหรือคัดลอกคีย์ API จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="ดำเนินการเริ่มต้นใช้งาน">
        สำหรับปลายทาง **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        สำหรับปลายทาง **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    รหัสตัวเลือกการยืนยันตัวตน `modelstudio-*` แบบเดิมและการอ้างอิงโมเดล `modelstudio/...`
    ยังคงใช้เป็นนามแฝงเพื่อความเข้ากันได้ แต่ขั้นตอนการตั้งค่าใหม่ควรเลือกใช้รหัสตัวเลือก
    การยืนยันตัวตนมาตรฐาน `qwen-*` และการอ้างอิงโมเดล `qwen/...` หากกำหนดรายการ
    `models.providers.modelstudio` แบบกำหนดเองที่ตรงกันทุกประการโดยใช้ค่า `api` อื่น
    ผู้ให้บริการแบบกำหนดเองนั้นจะเป็นเจ้าของการอ้างอิง `modelstudio/...` แทนนามแฝง
    เพื่อความเข้ากันได้ของ Qwen
    </Note>

  </Tab>

  <Tab title="Standard (จ่ายตามการใช้งาน)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบจ่ายตามการใช้งานผ่านปลายทาง Standard Model Studio รวมถึง `qwen3.7-max` และ `qwen3.6-flash` ซึ่งไม่มีให้ใช้ใน Coding Plan

    <Steps>
      <Step title="รับคีย์ API">
        สร้างหรือคัดลอกคีย์ API จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="ดำเนินการเริ่มต้นใช้งาน">
        สำหรับปลายทาง **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        สำหรับปลายทาง **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    รหัสตัวเลือกการยืนยันตัวตน `modelstudio-*` แบบเดิมและการอ้างอิงโมเดล `modelstudio/...`
    ยังคงใช้เป็นนามแฝงเพื่อความเข้ากันได้ แต่ขั้นตอนการตั้งค่าใหม่ควรเลือกใช้รหัสตัวเลือก
    การยืนยันตัวตนมาตรฐาน `qwen-*` และการอ้างอิงโมเดล `qwen/...` หากกำหนดรายการ
    `models.providers.modelstudio` แบบกำหนดเองที่ตรงกันทุกประการโดยใช้ค่า `api` อื่น
    ผู้ให้บริการแบบกำหนดเองนั้นจะเป็นเจ้าของการอ้างอิง `modelstudio/...` แทนนามแฝง
    เพื่อความเข้ากันได้ของ Qwen
    </Note>

  </Tab>

  <Tab title="Token Plan (รุ่นสำหรับทีม)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึง Qwen และโมเดลของบุคคลที่สามที่รองรับสำหรับทีมแบบสมัครสมาชิกตามเครดิตผ่าน Alibaba Cloud Model Studio

    <Steps>
      <Step title="รับคีย์เฉพาะของคุณ">
        กำหนดที่นั่ง Token Plan และสร้างคีย์ `sk-sp-...` เฉพาะสำหรับที่นั่งนั้น คีย์ของ Token Plan, Coding Plan และแบบจ่ายตามการใช้งานไม่สามารถใช้แทนกันได้ ดู[ภาพรวม Global Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) หรือ[ภาพรวม China Token Plan](https://help.aliyun.com/zh/model-studio/token-plan-overview)
      </Step>
      <Step title="ดำเนินการเริ่มต้นใช้งาน">
        สำหรับปลายทาง **Global / International** ในสิงคโปร์:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        สำหรับปลายทาง **China** ในปักกิ่ง:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="ตรวจสอบผู้ให้บริการ">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "ตอบกลับด้วย: Token Plan พร้อมใช้งาน"
        ```
      </Step>
    </Steps>

    <Note>
    คู่มือ OpenClaw ของ Alibaba ใช้ `bailian-token-plan` สำหรับผู้ให้บริการ
    แบบกำหนดเองด้วยตนเอง Plugin จะลงทะเบียนรหัสนั้นในฐานะเจ้าของเพื่อความเข้ากันได้
    แต่การกำหนดค่าใหม่ควรใช้ `qwen-token-plan` รายการแบบกำหนดเอง
    `models.providers.bailian-token-plan` ที่ตรงกันทุกประการจะยังคงเป็นเจ้าของ
    การรับส่งข้อมูลและแค็ตตาล็อกที่กำหนดค่าไว้ โดยจะไม่ถูกรวมเข้ากับแค็ตตาล็อก OpenAI มาตรฐาน
    </Note>

    <Warning>
    ใช้ Token Plan สำหรับเซสชัน OpenClaw แบบโต้ตอบเท่านั้น อย่าเลือกใช้กับ
    งาน Cron, สคริปต์ที่ทำงานโดยไม่มีผู้ดูแล หรือแบ็กเอนด์ของแอปพลิเคชัน Alibaba ระบุว่า
    การใช้งานแบบไม่โต้ตอบอาจทำให้การสมัครสมาชิกถูกระงับหรือคีย์ API ถูกเพิกถอน
    </Warning>

  </Tab>

</Tabs>

## ประเภทแผนและปลายทาง

| แผน                       | ภูมิภาค | ตัวเลือกการยืนยันตัวตน                | ปลายทาง                                                         |
| -------------------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (การสมัครสมาชิก) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (การสมัครสมาชิก) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Standard (จ่ายตามการใช้งาน)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (จ่ายตามการใช้งาน)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (รุ่นสำหรับทีม)  | China  | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (รุ่นสำหรับทีม)  | Global | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

ผู้ให้บริการจะเลือกปลายทางโดยอัตโนมัติตามตัวเลือกการยืนยันตัวตน ตัวเลือกมาตรฐาน
ใช้ตระกูล `qwen-*`; ส่วน `modelstudio-*` คงไว้เพื่อความเข้ากันได้เท่านั้น
เขียนทับได้ด้วย `baseUrl` แบบกำหนดเองในการกำหนดค่า

<Tip>
**จัดการคีย์:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**เอกสาร:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## แค็ตตาล็อกในตัว

OpenClaw มาพร้อมแค็ตตาล็อกแบบคงที่ของ Qwen นี้ แค็ตตาล็อกจะปรับตามปลายทาง:
การกำหนดค่า Coding Plan จะไม่รวมโมเดลที่ใช้ได้เฉพาะกับปลายทาง Standard

| การอ้างอิงโมเดล                   | อินพุต       | บริบท   | หมายเหตุ                   |
| --------------------------- | ----------- | --------- | ----------------------- |
| `qwen/qwen3.5-plus`         | ข้อความ, รูปภาพ | 1,000,000 | โมเดลเริ่มต้น           |
| `qwen/qwen3.6-flash`        | ข้อความ, รูปภาพ | 1,000,000 | เฉพาะปลายทาง Standard |
| `qwen/qwen3.6-plus`         | ข้อความ, รูปภาพ | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3.7-max`          | ข้อความ        | 1,000,000 | เฉพาะปลายทาง Standard |
| `qwen/qwen3.7-plus`         | ข้อความ, รูปภาพ | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3-max-2026-01-23` | ข้อความ        | 262,144   | สายผลิตภัณฑ์ Qwen Max           |
| `qwen/qwen3-coder-next`     | ข้อความ        | 262,144   | การเขียนโค้ด                  |
| `qwen/qwen3-coder-plus`     | ข้อความ        | 1,000,000 | การเขียนโค้ด                  |
| `qwen/MiniMax-M2.5`         | ข้อความ        | 1,000,000 | เปิดใช้การให้เหตุผล       |
| `qwen/glm-5`                | ข้อความ        | 202,752   | GLM                     |
| `qwen/glm-4.7`              | ข้อความ        | 202,752   | GLM                     |
| `qwen/kimi-k2.5`            | ข้อความ, รูปภาพ | 262,144   | Moonshot AI ผ่าน Alibaba |

<Note>
ความพร้อมใช้งานอาจยังแตกต่างกันตามปลายทางและแผนการเรียกเก็บเงิน แม้โมเดลนั้น
จะปรากฏอยู่ในแค็ตตาล็อกแบบคงที่ก็ตาม
</Note>

### แค็ตตาล็อก Token Plan

Token Plan ใช้รายการอนุญาตแบบจับคู่สตริงตรงกันทุกประการแยกต่างหาก โมเดลในแผน
ที่ใช้สำหรับสร้างรูปภาพเท่านั้นไม่รวมอยู่ที่นี่ เนื่องจากใช้ API คนละชุด

| การอ้างอิงโมเดล                           | อินพุต       | บริบท   |
| ----------------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | ข้อความ        | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | ข้อความ, รูปภาพ | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | ข้อความ, รูปภาพ | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | ข้อความ, รูปภาพ | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | ข้อความ        | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | ข้อความ        | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | ข้อความ        | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | ข้อความ, รูปภาพ | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | ข้อความ, รูปภาพ | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | ข้อความ, รูปภาพ | 262,144   |
| `qwen-token-plan/glm-5.2`           | ข้อความ        | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | ข้อความ        | 202,752   |
| `qwen-token-plan/glm-5`             | ข้อความ        | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | ข้อความ        | 196,608   |

## การควบคุมการคิด

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` และ `qwen3.6-plus`
รองรับการให้เหตุผลในแค็ตตาล็อกในตัว สำหรับโมเดลการให้เหตุผลในตระกูล `qwen`
ผู้ให้บริการจะแมประดับการคิดของ OpenClaw ไปยังแฟล็กคำขอระดับบนสุด
`enable_thinking` ของ DashScope: เมื่อปิดการคิดจะส่ง `enable_thinking: false`
ส่วนระดับอื่นทั้งหมดจะส่ง `enable_thinking: true` โมเดลแบบกำหนดเองสามารถเลือกใช้
เพย์โหลดการคิดของเทมเพลตแชตแบบอื่นได้โดยตั้งค่า
`compat.thinkingFormat: "qwen-chat-template"` ในรายการโมเดล

โมเดล Token Plan ยังถูกระบุว่ารองรับการให้เหตุผลด้วย `kimi-k2.7-code` และ
`MiniMax-M2.5` ใช้การคิดเท่านั้น ดังนั้น OpenClaw จะคงการคิดไว้แม้
เซสชันจะร้องขอ `/think off` DeepSeek V4 จะแมป `minimal` ถึง `high` ไปยัง
ระดับความพยายาม `high` ของบริการ และแมป `xhigh` หรือ `max` ไปยัง `max` GLM 5.2 รองรับ
ช่วงทั้งหมดตั้งแต่ `minimal` ถึง `max`; GLM 5.1 และ GLM 5 รองรับถึง
`xhigh` และทั้งสามโมเดลใช้ `high` เป็นค่าเริ่มต้น โมเดลไฮบริดอื่นจะทำตาม
สถานะเปิด/ปิดที่ร้องขอ

## ส่วนเสริมมัลติโมดัล

Plugin `qwen` เปิดใช้ความสามารถมัลติโมดัลเฉพาะบนปลายทาง DashScope แบบ **Standard**
เท่านั้น ไม่รองรับปลายทาง Coding Plan:

- **การทำความเข้าใจรูปภาพและวิดีโอ** ผ่าน `qwen3.6-plus`
- **การสร้างวิดีโอ Wan** ผ่าน `wan2.6-t2v` (ค่าเริ่มต้น), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

ระบบจะระบุการทำความเข้าใจสื่อโดยอัตโนมัติจากการยืนยันตัวตน Qwen ที่กำหนดค่าไว้
โดยไม่ต้องกำหนดค่าเพิ่มเติม ตรวจสอบให้แน่ใจว่าใช้ปลายทาง Standard (จ่ายตามการใช้งาน)
เพื่อให้การทำความเข้าใจสื่อทำงานได้

หากต้องการกำหนดให้ Qwen เป็นผู้ให้บริการวิดีโอเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

ข้อจำกัดในการสร้างวิดีโอ: วิดีโอเอาต์พุต 1 รายการต่อคำขอ, รูปภาพอินพุตสูงสุด 1 รูป
(รูปภาพเป็นวิดีโอ), วิดีโออินพุตสูงสุด 4 รายการ (วิดีโอเป็นวิดีโอ), ระยะเวลาสูงสุด 10 วินาที
รองรับ `size`, `aspectRatio`, `resolution`, `audio` และ
`watermark` อินพุตรูปภาพ/วิดีโออ้างอิงต้องใช้ URL ระยะไกลแบบ http(s) ส่วนพาธ
ไฟล์ภายในเครื่องจะถูกปฏิเสธตั้งแต่ต้น เนื่องจากปลายทางวิดีโอของ DashScope ไม่
ยอมรับบัฟเฟอร์ภายในเครื่องที่อัปโหลดสำหรับข้อมูลอ้างอิงเหล่านั้น

<Note>
ดูพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และลักษณะการทำงานเมื่อสลับระบบสำรองได้ที่ [การสร้างวิดีโอ](/th/tools/video-generation)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ความพร้อมใช้งานของ Qwen 3.6 และ 3.7">
    `qwen3.7-plus` และ `qwen3.6-plus` พร้อมใช้งานบนปลายทาง Coding Plan และ Standard ส่วน `qwen3.7-max` และ `qwen3.6-flash` ใช้งานได้เฉพาะ Standard เท่านั้น ปลายทาง Standard (ชำระตามการใช้งาน) ได้แก่:

    - จีน: `dashscope.aliyuncs.com/compatible-mode/v1`
    - ทั่วโลก: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw ไม่รวม `qwen3.7-max` และ `qwen3.6-flash` ไว้ในแค็ตตาล็อก Coding Plan
    หากปลายทาง Coding Plan ส่งคืนข้อผิดพลาด "unsupported model" สำหรับรุ่นใดรุ่นหนึ่ง
    ให้เปลี่ยนไปใช้ปลายทางและคีย์ Standard ที่ตรงกัน

  </Accordion>

  <Accordion title="การกำหนดเส้นทางตามภูมิภาคสำหรับการสร้างวิดีโอ">
    OpenClaw จับคู่ภูมิภาค Qwen ที่กำหนดค่าไว้กับโฮสต์ DashScope AIGC ที่ตรงกัน
    ก่อนส่งงานสร้างวิดีโอ:

    - ทั่วโลก/นานาชาติ: `https://dashscope-intl.aliyuncs.com`
    - จีน: `https://dashscope.aliyuncs.com`

    `models.providers.qwen.baseUrl` ปกติที่ชี้ไปยังโฮสต์ Qwen ของ Coding Plan
    หรือ Standard จะยังคงกำหนดเส้นทางการสร้างวิดีโอไปยังปลายทางวิดีโอ DashScope
    ประจำภูมิภาคที่ตรงกัน

  </Accordion>

  <Accordion title="ความเข้ากันได้ของข้อมูลการใช้งานแบบสตรีม">
    ปลายทาง Qwen แบบเนทีฟประกาศความเข้ากันได้กับข้อมูลการใช้งานแบบสตรีมบนทรานสปอร์ต
    `openai-completions` ที่ใช้ร่วมกัน ดังนั้น ID ผู้ให้บริการแบบกำหนดเองที่เข้ากันได้กับ DashScope
    และกำหนดเป้าหมายไปยังโฮสต์เนทีฟเดียวกันจึงรับช่วงลักษณะการทำงานเดียวกัน โดยไม่จำเป็นต้องใช้
    ID ผู้ให้บริการ `qwen` ที่มีมาให้โดยเฉพาะ ซึ่งใช้ได้กับปลายทาง Coding Plan,
    Standard และ Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="แผนความสามารถ">
    Plugin `qwen` กำลังถูกวางตำแหน่งให้เป็นศูนย์กลางของผู้จำหน่ายสำหรับพื้นผิว Qwen
    Cloud ทั้งหมด ไม่ใช่เพียงโมเดลสำหรับการเขียนโค้ด/ข้อความ

    - **โมเดลข้อความ/แชต:** พร้อมใช้งานผ่าน Plugin
    - **การเรียกใช้เครื่องมือ เอาต์พุตแบบมีโครงสร้าง การคิด:** รับช่วงจากทรานสปอร์ตที่เข้ากันได้กับ OpenAI
    - **การสร้างรูปภาพ:** วางแผนไว้ที่เลเยอร์ Plugin ของผู้ให้บริการ
    - **การทำความเข้าใจรูปภาพ/วิดีโอ:** พร้อมใช้งานผ่าน Plugin บนปลายทาง Standard
    - **เสียงพูด/เสียง:** วางแผนไว้ที่เลเยอร์ Plugin ของผู้ให้บริการ
    - **การฝังเวกเตอร์/การจัดอันดับใหม่สำหรับหน่วยความจำ:** วางแผนผ่านพื้นผิวอะแดปเตอร์การฝังเวกเตอร์
    - **การสร้างวิดีโอ:** พร้อมใช้งานผ่าน Plugin โดยใช้ความสามารถในการสร้างวิดีโอที่ใช้ร่วมกัน

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและดีมอน">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบว่า `QWEN_API_KEY`
    หรือ `QWEN_TOKEN_PLAN_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับระบบสำรอง
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Alibaba Model Studio" href="/th/providers/alibaba" icon="cloud">
    ผู้ให้บริการสร้างวิดีโอ Wan ที่รวมมาให้บนแพลตฟอร์ม DashScope เดียวกัน
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
