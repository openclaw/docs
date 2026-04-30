---
read_when:
    - คุณต้องการใช้ Qwen กับ OpenClaw
    - คุณเคยใช้ Qwen OAuth มาก่อน
summary: ใช้ Qwen Cloud ผ่านผู้ให้บริการ qwen ที่มาพร้อมกับ OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-30T10:13:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**Qwen OAuth ถูกนำออกแล้ว** การผสานรวม OAuth ระดับฟรี
(`qwen-portal`) ที่ใช้ปลายทาง `portal.qwen.ai` ไม่พร้อมใช้งานอีกต่อไป
ดู [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) สำหรับ
ภูมิหลัง

</Warning>

ขณะนี้ OpenClaw ถือว่า Qwen เป็นผู้ให้บริการแบบบันเดิลระดับหลัก โดยมีรหัสมาตรฐาน
`qwen` ผู้ให้บริการแบบบันเดิลนี้มุ่งไปที่ปลายทาง Qwen Cloud / Alibaba DashScope และ
Coding Plan และยังคงให้รหัสเดิม `modelstudio` ใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้

- ผู้ให้บริการ: `qwen`
- ตัวแปรสภาพแวดล้อมที่แนะนำ: `QWEN_API_KEY`
- ยอมรับเพื่อความเข้ากันได้ด้วย: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- รูปแบบ API: เข้ากันได้กับ OpenAI

<Tip>
หากคุณต้องการ `qwen3.6-plus` ให้ใช้ปลายทาง **Standard (pay-as-you-go)** เป็นหลัก
การรองรับ Coding Plan อาจตามหลังแค็ตตาล็อกสาธารณะ
</Tip>

## เริ่มต้นใช้งาน

เลือกประเภทแผนของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Coding Plan (การสมัครสมาชิก)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบสมัครสมาชิกผ่าน Qwen Coding Plan

    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างหรือคัดลอกคีย์ API จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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
    รหัส auth-choice เดิม `modelstudio-*` และการอ้างอิงโมเดล `modelstudio/...` ยังคง
    ใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่โฟลว์การตั้งค่าใหม่ควรใช้รหัส auth-choice
    มาตรฐาน `qwen-*` และการอ้างอิงโมเดล `qwen/...` เป็นหลัก หากคุณกำหนดรายการ
    `models.providers.modelstudio` แบบกำหนดเองที่ตรงทั้งหมดพร้อมค่า `api` อื่น
    ผู้ให้บริการแบบกำหนดเองนั้นจะเป็นเจ้าของการอ้างอิง `modelstudio/...` แทนนามแฝงเพื่อความเข้ากันได้ของ Qwen
    </Note>

  </Tab>

  <Tab title="Standard (จ่ายตามการใช้งาน)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบจ่ายตามการใช้งานผ่านปลายทาง Standard Model Studio รวมถึงโมเดลอย่าง `qwen3.6-plus` ที่อาจไม่มีให้ใช้บน Coding Plan

    <Steps>
      <Step title="รับคีย์ API ของคุณ">
        สร้างหรือคัดลอกคีย์ API จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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
    รหัส auth-choice เดิม `modelstudio-*` และการอ้างอิงโมเดล `modelstudio/...` ยังคง
    ใช้งานได้ในฐานะนามแฝงเพื่อความเข้ากันได้ แต่โฟลว์การตั้งค่าใหม่ควรใช้รหัส auth-choice
    มาตรฐาน `qwen-*` และการอ้างอิงโมเดล `qwen/...` เป็นหลัก หากคุณกำหนดรายการ
    `models.providers.modelstudio` แบบกำหนดเองที่ตรงทั้งหมดพร้อมค่า `api` อื่น
    ผู้ให้บริการแบบกำหนดเองนั้นจะเป็นเจ้าของการอ้างอิง `modelstudio/...` แทนนามแฝงเพื่อความเข้ากันได้ของ Qwen
    </Note>

  </Tab>
</Tabs>

## ประเภทแผนและปลายทาง

| แผน                       | ภูมิภาค | ตัวเลือกการตรวจสอบสิทธิ์                | ปลายทาง                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (จ่ายตามการใช้งาน)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (จ่ายตามการใช้งาน)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (การสมัครสมาชิก) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (การสมัครสมาชิก) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

ผู้ให้บริการจะเลือกปลายทางโดยอัตโนมัติตามตัวเลือกการตรวจสอบสิทธิ์ของคุณ ตัวเลือกมาตรฐาน
ใช้ตระกูล `qwen-*`; `modelstudio-*` ยังคงมีไว้เพื่อความเข้ากันได้เท่านั้น
คุณสามารถแทนที่ด้วย `baseUrl` แบบกำหนดเองในคอนฟิกได้

<Tip>
**จัดการคีย์:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**เอกสาร:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## แค็ตตาล็อกในตัว

ปัจจุบัน OpenClaw จัดส่งแค็ตตาล็อก Qwen แบบบันเดิลนี้ แค็ตตาล็อกที่กำหนดค่าไว้
รับรู้ปลายทาง: คอนฟิก Coding Plan จะละเว้นโมเดลที่ทราบว่าใช้งานได้เฉพาะบน
ปลายทาง Standard

| การอ้างอิงโมเดล                   | อินพุต       | บริบท   | หมายเหตุ                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | ข้อความ, รูปภาพ | 1,000,000 | โมเดลเริ่มต้น                                      |
| `qwen/qwen3.6-plus`         | ข้อความ, รูปภาพ | 1,000,000 | ใช้ปลายทาง Standard เป็นหลักเมื่อคุณต้องการโมเดลนี้ |
| `qwen/qwen3-max-2026-01-23` | ข้อความ        | 262,144   | สาย Qwen Max                                      |
| `qwen/qwen3-coder-next`     | ข้อความ        | 262,144   | การเขียนโค้ด                                             |
| `qwen/qwen3-coder-plus`     | ข้อความ        | 1,000,000 | การเขียนโค้ด                                             |
| `qwen/MiniMax-M2.5`         | ข้อความ        | 1,000,000 | เปิดใช้การให้เหตุผล                                  |
| `qwen/glm-5`                | ข้อความ        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | ข้อความ        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | ข้อความ, รูปภาพ | 262,144   | Moonshot AI ผ่าน Alibaba                            |

<Note>
ความพร้อมใช้งานยังอาจแตกต่างกันตามปลายทางและแผนการเรียกเก็บเงิน แม้ว่าโมเดลจะ
มีอยู่ในแค็ตตาล็อกแบบบันเดิลก็ตาม
</Note>

## การควบคุมการคิด

สำหรับโมเดล Qwen Cloud ที่เปิดใช้การให้เหตุผล ผู้ให้บริการแบบบันเดิลจะจับคู่ระดับ
การคิดของ OpenClaw กับแฟล็กคำขอระดับบนสุด `enable_thinking` ของ DashScope การปิดใช้
การคิดจะส่ง `enable_thinking: false`; ระดับการคิดอื่นจะส่ง
`enable_thinking: true`

## ส่วนเสริมมัลติโหมด

Plugin `qwen` ยังเปิดเผยความสามารถมัลติโหมดบนปลายทาง DashScope **Standard**
ด้วย (ไม่ใช่ปลายทาง Coding Plan):

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือร่วม การเลือกผู้ให้บริการ และพฤติกรรมการสลับเมื่อเกิดความล้มเหลว
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การทำความเข้าใจรูปภาพและวิดีโอ">
    Plugin Qwen แบบบันเดิลลงทะเบียนการทำความเข้าใจสื่อสำหรับรูปภาพและวิดีโอ
    บนปลายทาง DashScope **Standard** (ไม่ใช่ปลายทาง Coding Plan)

    | คุณสมบัติ      | ค่า                 |
    | ------------- | --------------------- |
    | โมเดล         | `qwen-vl-max-latest`  |
    | อินพุตที่รองรับ | รูปภาพ, วิดีโอ       |

    การทำความเข้าใจสื่อจะถูกแก้ไขโดยอัตโนมัติจากการตรวจสอบสิทธิ์ Qwen ที่กำหนดค่าไว้ โดยไม่
    ต้องมีคอนฟิกเพิ่มเติม ตรวจสอบให้แน่ใจว่าคุณใช้ปลายทาง Standard (จ่ายตามการใช้งาน)
    สำหรับการรองรับการทำความเข้าใจสื่อ

  </Accordion>

  <Accordion title="ความพร้อมใช้งานของ Qwen 3.6 Plus">
    `qwen3.6-plus` พร้อมใช้งานบนปลายทาง Standard (จ่ายตามการใช้งาน) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    หากปลายทาง Coding Plan ส่งคืนข้อผิดพลาด "unsupported model" สำหรับ
    `qwen3.6-plus` ให้เปลี่ยนไปใช้ Standard (จ่ายตามการใช้งาน) แทนคู่ปลายทาง/คีย์
    ของ Coding Plan

    แค็ตตาล็อก Qwen แบบบันเดิลของ OpenClaw ไม่ประกาศ `qwen3.6-plus` บนปลายทาง Coding
    Plan แต่รายการ `qwen/qwen3.6-plus` ที่กำหนดค่าไว้อย่างชัดเจนภายใต้
    `models.providers.qwen.models` จะได้รับการเคารพบน baseUrl ของ Coding Plan เพื่อให้คุณ
    เลือกใช้โมเดลนั้นได้หาก Aliyun เปิดใช้งานให้กับการสมัครสมาชิกของคุณ
    API ต้นทางยังคงเป็นผู้ตัดสินใจว่าการเรียกจะสำเร็จหรือไม่

  </Accordion>

  <Accordion title="แผนความสามารถ">
    Plugin `qwen` กำลังถูกวางตำแหน่งให้เป็นบ้านของผู้จำหน่ายสำหรับพื้นผิว Qwen
    Cloud ทั้งหมด ไม่ใช่แค่โมเดลการเขียนโค้ด/ข้อความ

    - **โมเดลข้อความ/แชต:** บันเดิลแล้วในขณะนี้
    - **การเรียกเครื่องมือ, เอาต์พุตแบบมีโครงสร้าง, การคิด:** สืบทอดจากทรานสปอร์ตที่เข้ากันได้กับ OpenAI
    - **การสร้างรูปภาพ:** วางแผนไว้ที่เลเยอร์ provider-plugin
    - **การทำความเข้าใจรูปภาพ/วิดีโอ:** บันเดิลแล้วในขณะนี้บนปลายทาง Standard
    - **เสียงพูด/เสียง:** วางแผนไว้ที่เลเยอร์ provider-plugin
    - **การฝัง/การจัดอันดับใหม่ของหน่วยความจำ:** วางแผนผ่านพื้นผิวอะแดปเตอร์ embedding
    - **การสร้างวิดีโอ:** บันเดิลแล้วในขณะนี้ผ่านความสามารถการสร้างวิดีโอร่วม

  </Accordion>

  <Accordion title="รายละเอียดการสร้างวิดีโอ">
    สำหรับการสร้างวิดีโอ OpenClaw จะจับคู่ภูมิภาค Qwen ที่กำหนดค่าไว้กับโฮสต์
    DashScope AIGC ที่ตรงกันก่อนส่งงาน:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    ซึ่งหมายความว่า `models.providers.qwen.baseUrl` ปกติที่ชี้ไปยังโฮสต์ Qwen
    ของ Coding Plan หรือ Standard ยังคงทำให้การสร้างวิดีโออยู่บนปลายทางวิดีโอ DashScope
    ประจำภูมิภาคที่ถูกต้อง

    ขีดจำกัดการสร้างวิดีโอ Qwen แบบบันเดิลในปัจจุบัน:

    - วิดีโอเอาต์พุตสูงสุด **1** รายการต่อคำขอ
    - รูปภาพอินพุตสูงสุด **1** รายการ
    - วิดีโออินพุตสูงสุด **4** รายการ
    - ระยะเวลาสูงสุด **10 วินาที**
    - รองรับ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
    - โหมดรูปภาพ/วิดีโออ้างอิงในขณะนี้ต้องใช้ **URL http(s) ระยะไกล** พาธ
      ไฟล์ภายในเครื่องจะถูกปฏิเสธตั้งแต่ต้น เพราะปลายทางวิดีโอ DashScope ไม่
      รับบัฟเฟอร์ภายในเครื่องที่อัปโหลดสำหรับการอ้างอิงเหล่านั้น

  </Accordion>

  <Accordion title="ความเข้ากันได้ของการใช้งานแบบสตรีมมิง">
    ปลายทาง Model Studio แบบเนทีฟประกาศความเข้ากันได้ของการใช้งานแบบสตรีมมิงบน
    ทรานสปอร์ตร่วม `openai-completions` ขณะนี้ OpenClaw อ้างอิงจากความสามารถของปลายทาง
    ดังนั้นรหัสผู้ให้บริการแบบกำหนดเองที่เข้ากันได้กับ DashScope ซึ่งมุ่งไปยังโฮสต์เนทีฟ
    เดียวกันจะสืบทอดพฤติกรรมการใช้งานแบบสตรีมมิงเดียวกัน แทนที่จะต้องใช้รหัสผู้ให้บริการ `qwen`
    ในตัวโดยเฉพาะ

    ความเข้ากันได้ของการใช้งานแบบสตรีมมิงเนทีฟใช้กับทั้งโฮสต์ Coding Plan และ
    โฮสต์ที่เข้ากันได้กับ Standard DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="ภูมิภาคปลายทางมัลติโหมด">
    พื้นผิวมัลติโหมด (การทำความเข้าใจวิดีโอและการสร้างวิดีโอ Wan) ใช้ปลายทาง DashScope
    **Standard** ไม่ใช่ปลายทาง Coding Plan:

    - URL ฐาน Standard ของ Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL ฐาน Standard ของ China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและดีมอน">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) ตรวจสอบให้แน่ใจว่า `QWEN_API_KEY`
    พร้อมใช้งานสำหรับกระบวนการนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/th/providers/alibaba" icon="cloud">
    ผู้ให้บริการ ModelStudio แบบเดิมและหมายเหตุการย้ายข้อมูล
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
