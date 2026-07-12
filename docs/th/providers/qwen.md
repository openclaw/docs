---
read_when:
    - คุณต้องการใช้ Qwen กับ OpenClaw
    - คุณมีการสมัครใช้งาน Alibaba Cloud Token Plan
    - ก่อนหน้านี้คุณใช้ Qwen OAuth
summary: ใช้ Qwen Cloud ผ่าน Plugin ของ OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-12T16:39:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud เป็น Plugin ผู้ให้บริการภายนอกอย่างเป็นทางการของ OpenClaw โดยมีรหัสมาตรฐานคือ `qwen` มุ่งรองรับปลายทาง Qwen Cloud / Alibaba DashScope Standard และ Coding Plan เปิดให้ใช้ Token Plan ในชื่อ `qwen-token-plan` คง `modelstudio` ไว้เป็นนามแฝงเพื่อความเข้ากันได้ ดูแลรหัสผู้ให้บริการแบบกำหนดเอง `bailian-token-plan` ที่ Alibaba ระบุไว้โดยอิสระ และเปิดให้ใช้ขั้นตอนโทเค็น Qwen Portal ในชื่อ [`qwen-oauth`](/th/providers/qwen-oauth)

| คุณสมบัติ                      | ค่า                                        |
| ---------------------- | ------------------------------------------ |
| ผู้ให้บริการ                    | `qwen`                                     |
| ผู้ให้บริการ Token Plan         | `qwen-token-plan`                          |
| ผู้ให้บริการ Portal             | [`qwen-oauth`](/th/providers/qwen-oauth)      |
| ตัวแปรสภาพแวดล้อมที่แนะนำ      | `QWEN_API_KEY`                             |
| ตัวแปรสภาพแวดล้อม Token Plan    | `QWEN_TOKEN_PLAN_API_KEY`                  |
| รองรับเพิ่มเติม (เพื่อความเข้ากันได้) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| รูปแบบ API                     | เข้ากันได้กับ OpenAI                       |

<Tip>
`qwen3.7-plus` และ `qwen3.6-plus` ใช้งานได้กับปลายทาง Coding Plan และ Standard
สำหรับ `qwen3.7-max` หรือ `qwen3.6-flash` ให้ใช้ปลายทาง **Standard (ชำระตามการใช้งาน)**
</Tip>

## ติดตั้ง Plugin

`qwen` จัดส่งเป็น Plugin ภายนอกอย่างเป็นทางการ ไม่ได้รวมมากับแกนหลัก ติดตั้งแล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

เลือกประเภทแผนของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบสมัครสมาชิกผ่าน Qwen Coding Plan

    <Steps>
      <Step title="Get your API key">
        สร้างหรือคัดลอกคีย์ API จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="Run onboarding">
        สำหรับปลายทาง **ทั่วโลก**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        สำหรับปลายทาง **จีน**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    รหัสตัวเลือกการตรวจสอบสิทธิ์แบบเดิม `modelstudio-*` และการอ้างอิงโมเดล `modelstudio/...`
    ยังคงใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่ขั้นตอนการตั้งค่าใหม่ควรใช้
    รหัสตัวเลือกการตรวจสอบสิทธิ์มาตรฐาน `qwen-*` และการอ้างอิงโมเดล `qwen/...`
    หากคุณกำหนดรายการ `models.providers.modelstudio` แบบกำหนดเองที่ตรงกันทุกประการ
    โดยใช้ค่า `api` อื่น ผู้ให้บริการแบบกำหนดเองนั้นจะเป็นเจ้าของการอ้างอิง
    `modelstudio/...` แทนนามแฝงเพื่อความเข้ากันได้ของ Qwen
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบชำระตามการใช้งานผ่านปลายทาง Standard Model Studio รวมถึง `qwen3.7-max` และ `qwen3.6-flash` ซึ่งไม่มีให้ใช้ใน Coding Plan

    <Steps>
      <Step title="Get your API key">
        สร้างหรือคัดลอกคีย์ API จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="Run onboarding">
        สำหรับปลายทาง **ทั่วโลก**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        สำหรับปลายทาง **จีน**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    รหัสตัวเลือกการตรวจสอบสิทธิ์แบบเดิม `modelstudio-*` และการอ้างอิงโมเดล `modelstudio/...`
    ยังคงใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่ขั้นตอนการตั้งค่าใหม่ควรใช้
    รหัสตัวเลือกการตรวจสอบสิทธิ์มาตรฐาน `qwen-*` และการอ้างอิงโมเดล `qwen/...`
    หากคุณกำหนดรายการ `models.providers.modelstudio` แบบกำหนดเองที่ตรงกันทุกประการ
    โดยใช้ค่า `api` อื่น ผู้ให้บริการแบบกำหนดเองนั้นจะเป็นเจ้าของการอ้างอิง
    `modelstudio/...` แทนนามแฝงเพื่อความเข้ากันได้ของ Qwen
    </Note>

  </Tab>

  <Tab title="Token Plan (Team Edition)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบสมัครสมาชิกสำหรับทีมโดยใช้เครดิต เพื่อใช้งาน Qwen และโมเดลของบุคคลที่สามที่รองรับผ่าน Alibaba Cloud Model Studio

    <Steps>
      <Step title="Get your dedicated key">
        กำหนดสิทธิ์ใช้งาน Token Plan และสร้างคีย์เฉพาะ `sk-sp-...` ของสิทธิ์นั้น คีย์ของ Token Plan, Coding Plan และแบบชำระตามการใช้งานไม่สามารถใช้แทนกันได้ ดู[ภาพรวม Token Plan สำหรับทั่วโลก](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) หรือ[ภาพรวม Token Plan สำหรับจีน](https://help.aliyun.com/zh/model-studio/token-plan-overview)
      </Step>
      <Step title="Run onboarding">
        สำหรับปลายทาง **ทั่วโลก / นานาชาติ** ในสิงคโปร์:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        สำหรับปลายทาง **จีน** ในปักกิ่ง:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Verify the provider">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    คู่มือ OpenClaw ของ Alibaba ใช้ `bailian-token-plan` สำหรับผู้ให้บริการ
    แบบกำหนดเองด้วยตนเอง Plugin จะลงทะเบียนรหัสนั้นในฐานะเจ้าของเพื่อความเข้ากันได้
    แต่การกำหนดค่าใหม่ควรใช้ `qwen-token-plan` รายการ
    `models.providers.bailian-token-plan` แบบกำหนดเองที่ตรงกันทุกประการจะยังคง
    เป็นเจ้าของการรับส่งข้อมูลและแค็ตตาล็อกที่กำหนดไว้ โดยจะไม่ถูกรวมเข้ากับ
    แค็ตตาล็อกมาตรฐานของ OpenAI
    </Note>

    <Warning>
    ใช้ Token Plan เฉพาะกับเซสชัน OpenClaw แบบโต้ตอบเท่านั้น อย่าเลือกใช้กับ
    งาน Cron, สคริปต์ที่ทำงานโดยไม่มีผู้ควบคุม หรือแบ็กเอนด์ของแอปพลิเคชัน Alibaba ระบุว่า
    การใช้งานแบบไม่โต้ตอบอาจทำให้การสมัครสมาชิกถูกระงับหรือคีย์ API ถูกเพิกถอน
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **เหมาะที่สุดสำหรับ:** โทเค็น Qwen Portal ที่ใช้กับ `https://portal.qwen.ai/v1`

    ดูหน้าผู้ให้บริการเฉพาะและหมายเหตุการย้ายระบบได้ที่
    [Qwen OAuth / Portal](/th/providers/qwen-oauth)

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` ใช้ชื่อตัวแปรสภาพแวดล้อม `QWEN_API_KEY` เดียวกับผู้ให้บริการ
    Qwen Cloud แต่จะจัดเก็บข้อมูลการตรวจสอบสิทธิ์ภายใต้รหัสผู้ให้บริการ `qwen-oauth`
    เมื่อกำหนดค่าผ่านขั้นตอนเริ่มต้นใช้งานของ OpenClaw
    </Note>

  </Tab>
</Tabs>

## ประเภทแผนและปลายทาง

| แผน                         | ภูมิภาค   | ตัวเลือกการตรวจสอบสิทธิ์       | ปลายทาง                                                          |
| -------------------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (สมัครสมาชิก)  | จีน      | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (สมัครสมาชิก)  | ทั่วโลก  | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                | ทั่วโลก  | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard (ชำระตามการใช้งาน) | จีน      | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (ชำระตามการใช้งาน) | ทั่วโลก  | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (รุ่นสำหรับทีม)   | จีน      | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (รุ่นสำหรับทีม)   | ทั่วโลก  | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

ผู้ให้บริการจะเลือกปลายทางโดยอัตโนมัติตามตัวเลือกการตรวจสอบสิทธิ์ของคุณ
ตัวเลือกมาตรฐานใช้ตระกูล `qwen-*` ส่วน `modelstudio-*` มีไว้เพื่อความเข้ากันได้เท่านั้น
เขียนทับค่าได้ด้วย `baseUrl` แบบกำหนดเองในการกำหนดค่า

<Tip>
**จัดการคีย์:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**เอกสาร:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## แค็ตตาล็อกในตัว

OpenClaw จัดส่งแค็ตตาล็อกแบบคงที่ของ Qwen นี้ แค็ตตาล็อกจะคำนึงถึงปลายทาง:
การกำหนดค่า Coding Plan จะไม่รวมโมเดลที่ใช้งานได้เฉพาะกับปลายทาง Standard

| การอ้างอิงโมเดล             | อินพุต       | บริบท      | หมายเหตุ                         |
| --------------------------- | ----------- | --------- | ----------------------- |
| `qwen/qwen3.5-plus`         | ข้อความ, รูปภาพ | 1,000,000 | โมเดลเริ่มต้น                    |
| `qwen/qwen3.6-flash`        | ข้อความ, รูปภาพ | 1,000,000 | เฉพาะปลายทาง Standard           |
| `qwen/qwen3.6-plus`         | ข้อความ, รูปภาพ | 1,000,000 | Coding Plan + Standard         |
| `qwen/qwen3.7-max`          | ข้อความ       | 1,000,000 | เฉพาะปลายทาง Standard           |
| `qwen/qwen3.7-plus`         | ข้อความ, รูปภาพ | 1,000,000 | Coding Plan + Standard         |
| `qwen/qwen3-max-2026-01-23` | ข้อความ       | 262,144   | สายผลิตภัณฑ์ Qwen Max            |
| `qwen/qwen3-coder-next`     | ข้อความ       | 262,144   | การเขียนโค้ด                     |
| `qwen/qwen3-coder-plus`     | ข้อความ       | 1,000,000 | การเขียนโค้ด                     |
| `qwen/MiniMax-M2.5`         | ข้อความ       | 1,000,000 | เปิดใช้การให้เหตุผล               |
| `qwen/glm-5`                | ข้อความ       | 202,752   | GLM                            |
| `qwen/glm-4.7`              | ข้อความ       | 202,752   | GLM                            |
| `qwen/kimi-k2.5`            | ข้อความ, รูปภาพ | 262,144   | Moonshot AI ผ่าน Alibaba       |
| `qwen-oauth/qwen3.5-plus`   | ข้อความ, รูปภาพ | 1,000,000 | ค่าเริ่มต้นของ Qwen Portal       |

<Note>
ความพร้อมใช้งานอาจยังแตกต่างกันตามปลายทางและแผนการเรียกเก็บเงิน แม้ว่าโมเดลนั้น
จะอยู่ในแค็ตตาล็อกแบบคงที่ก็ตาม
</Note>

### แค็ตตาล็อก Token Plan

Token Plan ใช้รายการอนุญาตแบบแยกต่างหากที่ต้องตรงกับสตริงทุกประการ
โมเดลในแผนที่ใช้สร้างรูปภาพเท่านั้นไม่รวมอยู่ที่นี่ เนื่องจากใช้ API คนละชุด

| การอ้างอิงโมเดล                    | อินพุต       | บริบท      |
| ----------------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | ข้อความ       | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | ข้อความ, รูปภาพ | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | ข้อความ, รูปภาพ | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | ข้อความ, รูปภาพ | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | ข้อความ       | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | ข้อความ       | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | ข้อความ       | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | ข้อความ, รูปภาพ | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | ข้อความ, รูปภาพ | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | ข้อความ, รูปภาพ | 262,144   |
| `qwen-token-plan/glm-5.2`           | ข้อความ       | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | ข้อความ       | 202,752   |
| `qwen-token-plan/glm-5`             | ข้อความ       | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | ข้อความ       | 196,608   |

## การควบคุมการคิด

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` และ `qwen3.6-plus`
รองรับการใช้เหตุผลในแค็ตตาล็อกที่มีมาให้ สำหรับโมเดลที่ใช้เหตุผลในตระกูล `qwen`
ผู้ให้บริการจะแมประดับการคิดของ OpenClaw ไปยังแฟล็กคำขอระดับบนสุด
`enable_thinking` ของ DashScope โดยการปิดการคิดจะส่ง `enable_thinking: false`
ส่วนระดับอื่นทั้งหมดจะส่ง `enable_thinking: true` โมเดลแบบกำหนดเองสามารถเลือกใช้
เพย์โหลดการคิดผ่านเทมเพลตแชตทางเลือกได้โดยตั้งค่า
`compat.thinkingFormat: "qwen-chat-template"` ในรายการโมเดล

โมเดล Token Plan ยังถูกระบุว่ารองรับการใช้เหตุผลด้วย `kimi-k2.7-code` และ
`MiniMax-M2.5` เป็นโมเดลที่ใช้ได้เฉพาะโหมดคิด ดังนั้น OpenClaw จะเปิดการคิดไว้
แม้เซสชันจะร้องขอ `/think off` DeepSeek V4 จะแมประดับ `minimal` ถึง `high`
ไปยังระดับความพยายาม `high` ของบริการ และแมป `xhigh` หรือ `max` ไปยัง `max`
GLM 5.2 รองรับช่วงเต็มตั้งแต่ `minimal` ถึง `max`; GLM 5.1 และ GLM 5 รองรับ
ถึง `xhigh` และทั้งสามโมเดลใช้ค่าเริ่มต้นเป็น `high` โมเดลไฮบริดอื่นจะทำตาม
สถานะเปิด/ปิดที่ร้องขอ

## ส่วนเสริมแบบหลายสื่อ

Plugin `qwen` เปิดให้ใช้ความสามารถแบบหลายสื่อเฉพาะบนปลายทาง DashScope
แบบ **มาตรฐาน** เท่านั้น ไม่รองรับบนปลายทาง Coding Plan:

- **การทำความเข้าใจรูปภาพและวิดีโอ** ผ่าน `qwen-vl-max-latest`
- **การสร้างวิดีโอด้วย Wan** ผ่าน `wan2.6-t2v` (ค่าเริ่มต้น), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

ระบบจะกำหนดการทำความเข้าใจสื่อโดยอัตโนมัติจากการยืนยันตัวตน Qwen ที่กำหนดค่าไว้
โดยไม่จำเป็นต้องตั้งค่าเพิ่มเติม โปรดตรวจสอบว่าคุณกำลังใช้ปลายทางแบบมาตรฐาน
(ชำระตามการใช้งาน) เพื่อให้การทำความเข้าใจสื่อทำงานได้

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

ข้อจำกัดในการสร้างวิดีโอ: วิดีโอผลลัพธ์ 1 รายการต่อคำขอ, รูปภาพอินพุตสูงสุด
1 รูป (รูปภาพเป็นวิดีโอ), วิดีโออินพุตสูงสุด 4 รายการ (วิดีโอเป็นวิดีโอ) และ
ระยะเวลาสูงสุด 10 วินาที รองรับ `size`, `aspectRatio`, `resolution`, `audio`
และ `watermark` อินพุตรูปภาพ/วิดีโออ้างอิงต้องใช้ URL http(s) ระยะไกล
ระบบจะปฏิเสธพาธไฟล์ภายในตั้งแต่ต้น เนื่องจากปลายทางวิดีโอของ DashScope
ไม่รองรับบัฟเฟอร์ภายในที่อัปโหลดสำหรับข้อมูลอ้างอิงเหล่านั้น

<Note>
ดู[การสร้างวิดีโอ](/th/tools/video-generation)สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ความพร้อมใช้งานของ Qwen 3.6 และ 3.7">
    `qwen3.7-plus` และ `qwen3.6-plus` พร้อมใช้งานบนปลายทาง Coding Plan และแบบมาตรฐาน ส่วน `qwen3.7-max` และ `qwen3.6-flash` ใช้ได้เฉพาะแบบมาตรฐาน ปลายทางแบบมาตรฐาน (ชำระตามการใช้งาน) ได้แก่:

    - จีน: `dashscope.aliyuncs.com/compatible-mode/v1`
    - ทั่วโลก: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw จะไม่รวม `qwen3.7-max` และ `qwen3.6-flash` ไว้ในแค็ตตาล็อก Coding Plan
    หากปลายทาง Coding Plan ส่งคืนข้อผิดพลาด "โมเดลที่ไม่รองรับ" สำหรับโมเดลใดโมเดลหนึ่ง
    ให้เปลี่ยนไปใช้ปลายทางแบบมาตรฐานและคีย์ที่ตรงกัน

  </Accordion>

  <Accordion title="การกำหนดเส้นทางภูมิภาคสำหรับการสร้างวิดีโอ">
    OpenClaw จะแมปภูมิภาค Qwen ที่กำหนดค่าไว้ไปยังโฮสต์ DashScope AIGC ที่ตรงกัน
    ก่อนส่งงานวิดีโอ:

    - ทั่วโลก/นานาชาติ: `https://dashscope-intl.aliyuncs.com`
    - จีน: `https://dashscope.aliyuncs.com`

    `models.providers.qwen.baseUrl` ปกติที่ชี้ไปยังโฮสต์ Qwen แบบ Coding Plan
    หรือแบบมาตรฐาน จะยังคงกำหนดเส้นทางการสร้างวิดีโอไปยังปลายทางวิดีโอ DashScope
    ในภูมิภาคที่ตรงกัน

  </Accordion>

  <Accordion title="ความเข้ากันได้ของข้อมูลการใช้งานแบบสตรีม">
    ปลายทาง Qwen ดั้งเดิมประกาศความเข้ากันได้ของข้อมูลการใช้งานแบบสตรีมบน
    การขนส่ง `openai-completions` ที่ใช้ร่วมกัน ดังนั้นรหัสผู้ให้บริการแบบกำหนดเอง
    ที่เข้ากันได้กับ DashScope และกำหนดเป้าหมายไปยังโฮสต์ดั้งเดิมเดียวกัน
    จะสืบทอดลักษณะการทำงานเดียวกันโดยไม่จำเป็นต้องใช้รหัสผู้ให้บริการ `qwen`
    ที่มีมาให้โดยเฉพาะ ข้อนี้ใช้กับปลายทาง Coding Plan, แบบมาตรฐาน และ Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="แผนความสามารถ">
    Plugin `qwen` กำลังถูกวางตำแหน่งให้เป็นศูนย์รวมของผู้จำหน่ายสำหรับพื้นผิว
    Qwen Cloud ทั้งหมด ไม่ใช่เพียงโมเดลสำหรับการเขียนโค้ด/ข้อความเท่านั้น

    - **โมเดลข้อความ/แชต:** พร้อมใช้งานผ่าน Plugin
    - **การเรียกใช้เครื่องมือ, เอาต์พุตแบบมีโครงสร้าง, การคิด:** สืบทอดจากการขนส่งที่เข้ากันได้กับ OpenAI
    - **การสร้างรูปภาพ:** วางแผนไว้ที่ชั้น Plugin ของผู้ให้บริการ
    - **การทำความเข้าใจรูปภาพ/วิดีโอ:** พร้อมใช้งานผ่าน Plugin บนปลายทางแบบมาตรฐาน
    - **เสียงพูด/เสียง:** วางแผนไว้ที่ชั้น Plugin ของผู้ให้บริการ
    - **การฝังเวกเตอร์/การจัดอันดับใหม่สำหรับหน่วยความจำ:** วางแผนผ่านพื้นผิวอะแดปเตอร์การฝังเวกเตอร์
    - **การสร้างวิดีโอ:** พร้อมใช้งานผ่าน Plugin โดยใช้ความสามารถในการสร้างวิดีโอที่ใช้ร่วมกัน

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและดีมอน">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบว่าโปรเซสนั้นสามารถเข้าถึง
    `QWEN_API_KEY` หรือ `QWEN_TOKEN_PLAN_API_KEY` ได้ (ตัวอย่างเช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
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
