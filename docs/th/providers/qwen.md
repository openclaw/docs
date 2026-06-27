---
read_when:
    - คุณต้องการใช้ Qwen กับ OpenClaw
    - คุณเคยใช้ Qwen OAuth ก่อนหน้านี้
summary: ใช้ Qwen Cloud ผ่าน Plugin ของ OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:16:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw ตอนนี้ถือว่า Qwen เป็น Plugin ผู้ให้บริการระดับหลัก โดยมี id ตามแบบมาตรฐานคือ
`qwen` Plugin ผู้ให้บริการนี้รองรับปลายทาง Qwen Cloud / Alibaba DashScope และ
Coding Plan, ยังคงให้ id เดิม `modelstudio` ใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้
และยังเปิดให้ใช้โฟลว์โทเค็น Qwen Portal ในฐานะผู้ให้บริการ `qwen-oauth` ด้วย

- ผู้ให้บริการ: `qwen`
- ผู้ให้บริการ Portal: [`qwen-oauth`](/th/providers/qwen-oauth)
- env var ที่แนะนำ: `QWEN_API_KEY`
- ยอมรับเพื่อความเข้ากันได้ด้วย: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- รูปแบบ API: เข้ากันได้กับ OpenAI

<Tip>
หากคุณต้องการ `qwen3.6-plus` ให้เลือกใช้ปลายทาง **Standard (pay-as-you-go)**
การรองรับ Coding Plan อาจตามหลังแค็ตตาล็อกสาธารณะ
</Tip>

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ต Gateway:

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
        สำหรับปลายทาง **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        สำหรับปลายทาง **China**:

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
    id auth-choice เดิมแบบ `modelstudio-*` และ model ref แบบ `modelstudio/...` ยัง
    ใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่โฟลว์การตั้งค่าใหม่ควรใช้ id auth-choice
    ตามแบบมาตรฐาน `qwen-*` และ model ref `qwen/...` หากคุณกำหนดรายการ
    `models.providers.modelstudio` แบบกำหนดเองตรงตัวพร้อมค่า `api` อื่น
    ผู้ให้บริการแบบกำหนดเองนั้นจะเป็นเจ้าของ ref `modelstudio/...` แทนนามแฝง
    เพื่อความเข้ากันได้ของ Qwen
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบจ่ายตามการใช้งานผ่านปลายทาง Standard Model Studio รวมถึงโมเดลอย่าง `qwen3.6-plus` ที่อาจไม่มีใน Coding Plan

    <Steps>
      <Step title="Get your API key">
        สร้างหรือคัดลอกคีย์ API จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="Run onboarding">
        สำหรับปลายทาง **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        สำหรับปลายทาง **China**:

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
    id auth-choice เดิมแบบ `modelstudio-*` และ model ref แบบ `modelstudio/...` ยัง
    ใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่โฟลว์การตั้งค่าใหม่ควรใช้ id auth-choice
    ตามแบบมาตรฐาน `qwen-*` และ model ref `qwen/...` หากคุณกำหนดรายการ
    `models.providers.modelstudio` แบบกำหนดเองตรงตัวพร้อมค่า `api` อื่น
    ผู้ให้บริการแบบกำหนดเองนั้นจะเป็นเจ้าของ ref `modelstudio/...` แทนนามแฝง
    เพื่อความเข้ากันได้ของ Qwen
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **เหมาะที่สุดสำหรับ:** โทเค็น Qwen Portal ที่ใช้กับ `https://portal.qwen.ai/v1`

    ดู [Qwen OAuth / Portal](/th/providers/qwen-oauth) สำหรับหน้าผู้ให้บริการเฉพาะ
    และหมายเหตุการย้ายระบบ

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
    `qwen-oauth` ใช้ชื่อ env var `QWEN_API_KEY` เดียวกับผู้ให้บริการ DashScope
    แต่จัดเก็บ auth ภายใต้ id ผู้ให้บริการ `qwen-oauth` เมื่อกำหนดค่าผ่าน
    การเริ่มต้นใช้งานของ OpenClaw
    </Note>

  </Tab>
</Tabs>

## ประเภทแผนและปลายทาง

| แผน                       | ภูมิภาค | ตัวเลือก Auth                | ปลายทาง                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

ผู้ให้บริการจะเลือกปลายทางโดยอัตโนมัติตามตัวเลือก auth ของคุณ ตัวเลือกตามแบบมาตรฐาน
ใช้ตระกูล `qwen-*`; `modelstudio-*` เหลือไว้เพื่อความเข้ากันได้เท่านั้น
คุณสามารถ override ด้วย `baseUrl` แบบกำหนดเองใน config ได้

<Tip>
**จัดการคีย์:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**เอกสาร:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## แค็ตตาล็อกในตัว

ปัจจุบัน OpenClaw มาพร้อมแค็ตตาล็อกแบบคงที่ของ Qwen นี้ แค็ตตาล็อกที่กำหนดค่าไว้
รับรู้ปลายทาง: config ของ Coding Plan จะละเว้นโมเดลที่ทราบว่าใช้ได้เฉพาะบน
ปลายทาง Standard

| Model ref                   | อินพุต       | บริบท   | หมายเหตุ                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | ข้อความ, รูปภาพ | 1,000,000 | โมเดลเริ่มต้น                                      |
| `qwen/qwen3.6-plus`         | ข้อความ, รูปภาพ | 1,000,000 | แนะนำให้ใช้ปลายทาง Standard เมื่อคุณต้องการโมเดลนี้ |
| `qwen/qwen3-max-2026-01-23` | ข้อความ        | 262,144   | สาย Qwen Max                                      |
| `qwen/qwen3-coder-next`     | ข้อความ        | 262,144   | การเขียนโค้ด                                             |
| `qwen/qwen3-coder-plus`     | ข้อความ        | 1,000,000 | การเขียนโค้ด                                             |
| `qwen/MiniMax-M2.5`         | ข้อความ        | 1,000,000 | เปิดใช้งานการให้เหตุผล                                  |
| `qwen/glm-5`                | ข้อความ        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | ข้อความ        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | ข้อความ, รูปภาพ | 262,144   | Moonshot AI ผ่าน Alibaba                            |
| `qwen-oauth/qwen3.5-plus`   | ข้อความ, รูปภาพ | 1,000,000 | ค่าเริ่มต้นของ Qwen Portal                                |

<Note>
ความพร้อมใช้งานยังอาจแตกต่างกันตามปลายทางและแผนการเรียกเก็บเงิน แม้โมเดลจะ
อยู่ในแค็ตตาล็อกแบบคงที่ก็ตาม
</Note>

## การควบคุม Thinking

สำหรับโมเดล Qwen Cloud ที่เปิดใช้งานการให้เหตุผล ผู้ให้บริการจะแมประดับ
thinking ของ OpenClaw ไปยังแฟล็กคำขอระดับบนสุด `enable_thinking` ของ DashScope
เมื่อปิดใช้ thinking จะส่ง `enable_thinking: false`; ระดับ thinking อื่นจะส่ง
`enable_thinking: true`

## ส่วนเสริมมัลติโหมด

Plugin `qwen` ยังเปิดให้ใช้ความสามารถมัลติโหมดบนปลายทาง DashScope แบบ **Standard**
(ไม่ใช่ปลายทาง Coding Plan):

- **การทำความเข้าใจวิดีโอ** ผ่าน `qwen-vl-max-latest`
- **การสร้างวิดีโอ Wan** ผ่าน `wan2.6-t2v` (ค่าเริ่มต้น), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

หากต้องการใช้ Qwen เป็นผู้ให้บริการวิดีโอเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Plugin Qwen ลงทะเบียนการทำความเข้าใจสื่อสำหรับรูปภาพและวิดีโอ
    บนปลายทาง DashScope แบบ **Standard** (ไม่ใช่ปลายทาง Coding Plan)

    | คุณสมบัติ      | ค่า                 |
    | ------------- | --------------------- |
    | โมเดล         | `qwen-vl-max-latest`  |
    | อินพุตที่รองรับ | รูปภาพ, วิดีโอ       |

    การทำความเข้าใจสื่อจะถูก resolve โดยอัตโนมัติจาก auth ของ Qwen ที่กำหนดค่าไว้ โดยไม่ต้องมี
    config เพิ่มเติม ตรวจสอบให้แน่ใจว่าคุณใช้ปลายทาง Standard (pay-as-you-go)
    เพื่อรองรับการทำความเข้าใจสื่อ

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` พร้อมใช้งานบนปลายทาง Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    หากปลายทาง Coding Plan ส่งคืนข้อผิดพลาด "unsupported model" สำหรับ
    `qwen3.6-plus` ให้เปลี่ยนไปใช้ Standard (pay-as-you-go) แทนคู่ปลายทาง/คีย์ของ
    Coding Plan

    แค็ตตาล็อกแบบคงที่ของ Qwen ใน OpenClaw จะไม่ประกาศ `qwen3.6-plus` บนปลายทาง
    Coding Plan แต่รายการ `qwen/qwen3.6-plus` ที่กำหนดค่าไว้อย่างชัดเจนภายใต้
    `models.providers.qwen.models` จะถูกใช้งานบน baseUrl ของ Coding Plan เพื่อให้คุณ
    เลือกใช้โมเดลนั้นได้หาก Aliyun เปิดใช้งานบนการสมัครสมาชิกของคุณ
    API ต้นทางยังคงเป็นผู้ตัดสินว่าการเรียกใช้งานจะสำเร็จหรือไม่

  </Accordion>

  <Accordion title="Capability plan">
    Plugin `qwen` กำลังถูกวางให้เป็นบ้านของผู้ขายสำหรับพื้นผิว Qwen
    Cloud แบบครบถ้วน ไม่ใช่แค่โมเดลเขียนโค้ด/ข้อความ

    - **โมเดลข้อความ/แชต:** พร้อมใช้งานผ่าน Plugin
    - **การเรียกเครื่องมือ, เอาต์พุตแบบมีโครงสร้าง, thinking:** สืบทอดจากทรานสปอร์ตที่เข้ากันได้กับ OpenAI
    - **การสร้างรูปภาพ:** วางแผนไว้ที่เลเยอร์ Plugin ผู้ให้บริการ
    - **การทำความเข้าใจรูปภาพ/วิดีโอ:** พร้อมใช้งานผ่าน Plugin บนปลายทาง Standard
    - **เสียงพูด/เสียง:** วางแผนไว้ที่เลเยอร์ Plugin ผู้ให้บริการ
    - **การฝังหน่วยความจำ/การจัดอันดับใหม่:** วางแผนผ่านพื้นผิวอะแดปเตอร์ embedding
    - **การสร้างวิดีโอ:** พร้อมใช้งานผ่าน Plugin ผ่านความสามารถการสร้างวิดีโอร่วม

  </Accordion>

  <Accordion title="Video generation details">
    สำหรับการสร้างวิดีโอ OpenClaw จะแมปภูมิภาค Qwen ที่กำหนดค่าไว้ไปยังโฮสต์
    DashScope AIGC ที่ตรงกันก่อนส่งงาน:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    ซึ่งหมายความว่า `models.providers.qwen.baseUrl` ปกติที่ชี้ไปยังโฮสต์ Qwen แบบ
    Coding Plan หรือ Standard ยังคงทำให้การสร้างวิดีโอใช้ปลายทางวิดีโอ DashScope
    ประจำภูมิภาคที่ถูกต้อง

    ขีดจำกัดการสร้างวิดีโอของ Qwen ปัจจุบัน:

    - วิดีโอเอาต์พุตสูงสุด **1** รายการต่อคำขอ
    - รูปภาพอินพุตสูงสุด **1** รูป
    - วิดีโออินพุตสูงสุด **4** รายการ
    - ระยะเวลาสูงสุด **10 วินาที**
    - รองรับ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
    - โหมดรูปภาพ/วิดีโออ้างอิงในปัจจุบันต้องใช้ **URL http(s) ระยะไกล** ระบบจะปฏิเสธ
      พาธไฟล์ในเครื่องตั้งแต่ต้น เพราะปลายทางวิดีโอ DashScope ไม่ยอมรับบัฟเฟอร์ในเครื่อง
      ที่อัปโหลดสำหรับการอ้างอิงเหล่านั้น

  </Accordion>

  <Accordion title="ความเข้ากันได้ของการใช้งานแบบสตรีม">
    ปลายทาง Model Studio แบบเนทีฟประกาศความเข้ากันได้ของการใช้งานแบบสตรีมบน
    การส่งข้อมูล `openai-completions` ที่ใช้ร่วมกัน ตอนนี้ OpenClaw อ้างอิงสิ่งนั้นจากความสามารถของปลายทาง
    ดังนั้น id ผู้ให้บริการแบบกำหนดเองที่เข้ากันได้กับ DashScope ซึ่งกำหนดเป้าหมายไปยังโฮสต์เนทีฟเดียวกัน
    จะสืบทอดลักษณะการทำงานด้านการใช้งานแบบสตรีมเดียวกัน แทนที่จะต้องใช้
    id ผู้ให้บริการ `qwen` ในตัวโดยเฉพาะ

    ความเข้ากันได้ของการใช้งานแบบสตรีมเนทีฟใช้กับทั้งโฮสต์ Coding Plan และ
    โฮสต์มาตรฐานที่เข้ากันได้กับ DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="ภูมิภาคของปลายทางมัลติโมดัล">
    พื้นผิวมัลติโมดัล (การทำความเข้าใจวิดีโอและการสร้างวิดีโอ Wan) ใช้
    ปลายทาง DashScope แบบ **มาตรฐาน** ไม่ใช่ปลายทาง Coding Plan:

    - URL ฐานมาตรฐาน Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL ฐานมาตรฐานจีน: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและ daemon">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `QWEN_API_KEY`
    พร้อมใช้งานสำหรับกระบวนการนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานของ failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/th/providers/alibaba" icon="cloud">
    ผู้ให้บริการ ModelStudio แบบเดิมและหมายเหตุการย้ายระบบ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
