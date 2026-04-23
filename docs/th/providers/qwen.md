---
read_when:
    - คุณต้องการใช้ Qwen กับ OpenClaw
    - ก่อนหน้านี้คุณเคยใช้ Qwen OAuth
summary: ใช้ Qwen Cloud ผ่าน provider qwen แบบ bundled ของ OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T10:22:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth ถูกนำออกแล้ว** การเชื่อมต่อ OAuth แบบฟรี
(`qwen-portal`) ที่ใช้ endpoint ของ `portal.qwen.ai` ไม่สามารถใช้งานได้อีกต่อไป
ดู [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) สำหรับ
ข้อมูลเบื้องหลัง

</Warning>

ขณะนี้ OpenClaw ถือว่า Qwen เป็น provider แบบ bundled ชั้นหนึ่ง โดยมี canonical id
เป็น `qwen` provider แบบ bundled นี้มุ่งเป้าไปที่ endpoint ของ Qwen Cloud / Alibaba DashScope และ
Coding Plan และยังคงให้ `modelstudio` id แบบเดิมทำงานต่อได้ในฐานะ alias เพื่อความเข้ากันได้

- Provider: `qwen`
- ตัวแปร env ที่แนะนำ: `QWEN_API_KEY`
- ที่ยังยอมรับเพื่อความเข้ากันได้: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- รูปแบบ API: เข้ากันได้กับ OpenAI

<Tip>
หากคุณต้องการ `qwen3.6-plus` ให้เลือกใช้ endpoint แบบ **Standard (จ่ายตามการใช้งาน)** เป็นหลัก
การรองรับใน Coding Plan อาจตามแค็ตตาล็อกสาธารณะไม่ทัน
</Tip>

## เริ่มต้นใช้งาน

เลือกประเภทแผนของคุณแล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Coding Plan (การสมัครใช้งาน)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบสมัครใช้งานผ่าน Qwen Coding Plan

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="รัน onboarding">
        สำหรับ endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        สำหรับ endpoint **China**:

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
    `auth-choice` แบบเดิม `modelstudio-*` และ ref โมเดล `modelstudio/...` ยังคง
    ใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่โฟลว์การตั้งค่าใหม่ควรใช้
    `auth-choice` แบบ canonical ตระกูล `qwen-*` และ ref โมเดล `qwen/...`
    </Note>

  </Tab>

  <Tab title="Standard (จ่ายตามการใช้งาน)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบจ่ายตามการใช้งานผ่าน endpoint Standard Model Studio รวมถึงโมเดลอย่าง `qwen3.6-plus` ที่อาจไม่มีใน Coding Plan

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="รัน onboarding">
        สำหรับ endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        สำหรับ endpoint **China**:

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
    `auth-choice` แบบเดิม `modelstudio-*` และ ref โมเดล `modelstudio/...` ยังคง
    ใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่โฟลว์การตั้งค่าใหม่ควรใช้
    `auth-choice` แบบ canonical ตระกูล `qwen-*` และ ref โมเดล `qwen/...`
    </Note>

  </Tab>
</Tabs>

## ประเภทแผนและ endpoint

| Plan                       | Region | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (จ่ายตามการใช้งาน) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (จ่ายตามการใช้งาน) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (การสมัครใช้งาน) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (การสมัครใช้งาน) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

provider จะเลือก endpoint อัตโนมัติตาม auth choice ของคุณ ตัวเลือกแบบ canonical
ใช้ตระกูล `qwen-*`; ส่วน `modelstudio-*` มีไว้เพื่อความเข้ากันได้เท่านั้น
คุณสามารถแทนที่ด้วย `baseUrl` แบบกำหนดเองในคอนฟิกได้

<Tip>
**จัดการคีย์:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**เอกสาร:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## แค็ตตาล็อกในตัว

ขณะนี้ OpenClaw มาพร้อมแค็ตตาล็อก Qwen แบบ bundled ดังต่อไปนี้ แค็ตตาล็อกที่กำหนดค่าไว้
รับรู้ endpoint: คอนฟิก Coding Plan จะตัดโมเดลที่ทราบว่าใช้ได้เฉพาะบน
endpoint Standard ออก

| Model ref                   | อินพุต      | บริบท      | หมายเหตุ                                            |
| --------------------------- | ----------- | ---------- | --------------------------------------------------- |
| `qwen/qwen3.5-plus`         | ข้อความ, ภาพ | 1,000,000  | โมเดลเริ่มต้น                                       |
| `qwen/qwen3.6-plus`         | ข้อความ, ภาพ | 1,000,000  | หากต้องใช้โมเดลนี้ให้เลือก endpoint Standard       |
| `qwen/qwen3-max-2026-01-23` | ข้อความ      | 262,144    | สาย Qwen Max                                        |
| `qwen/qwen3-coder-next`     | ข้อความ      | 262,144    | Coding                                              |
| `qwen/qwen3-coder-plus`     | ข้อความ      | 1,000,000  | Coding                                              |
| `qwen/MiniMax-M2.5`         | ข้อความ      | 1,000,000  | เปิดใช้ reasoning                                   |
| `qwen/glm-5`                | ข้อความ      | 202,752    | GLM                                                 |
| `qwen/glm-4.7`              | ข้อความ      | 202,752    | GLM                                                 |
| `qwen/kimi-k2.5`            | ข้อความ, ภาพ | 262,144    | Moonshot AI ผ่าน Alibaba                            |

<Note>
ความพร้อมใช้งานยังคงแตกต่างกันได้ตาม endpoint และแผนการเรียกเก็บเงิน แม้ว่าโมเดลนั้น
จะอยู่ในแค็ตตาล็อกแบบ bundled
</Note>

## ส่วนเสริมหลายสื่อ

plugin `qwen` ยังเปิดเผยความสามารถหลายสื่อบน endpoint DashScope แบบ **Standard**
(ไม่ใช่ endpoint ของ Coding Plan):

- **การเข้าใจวิดีโอ** ผ่าน `qwen-vl-max-latest`
- **การสร้างวิดีโอ Wan** ผ่าน `wan2.6-t2v` (ค่าเริ่มต้น), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

หากต้องการใช้ Qwen เป็น provider วิดีโอเริ่มต้น:

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของ tool แบบใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

## ขั้นสูง

<AccordionGroup>
  <Accordion title="การเข้าใจภาพและวิดีโอ">
    plugin Qwen แบบ bundled จะลงทะเบียนความสามารถในการเข้าใจสื่อสำหรับภาพและวิดีโอ
    บน endpoint DashScope แบบ **Standard** (ไม่ใช่ endpoint ของ Coding Plan)

    | Property      | Value                |
    | ------------- | -------------------- |
    | โมเดล         | `qwen-vl-max-latest` |
    | อินพุตที่รองรับ | รูปภาพ, วิดีโอ       |

    ความสามารถในการเข้าใจสื่อจะถูก resolve อัตโนมัติจากการยืนยันตัวตน Qwen ที่กำหนดไว้ — ไม่
    จำเป็นต้องมีคอนฟิกเพิ่มเติม ตรวจสอบให้แน่ใจว่าคุณใช้
    endpoint แบบ Standard (จ่ายตามการใช้งาน) หากต้องการรองรับการเข้าใจสื่อ

  </Accordion>

  <Accordion title="ความพร้อมใช้งานของ Qwen 3.6 Plus">
    `qwen3.6-plus` มีให้ใช้บน endpoint Model Studio แบบ Standard (จ่ายตามการใช้งาน):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    หาก endpoint ของ Coding Plan ส่งข้อผิดพลาด "unsupported model" สำหรับ
    `qwen3.6-plus` ให้สลับไปใช้ Standard (จ่ายตามการใช้งาน) แทน endpoint/คีย์ของ Coding Plan

  </Accordion>

  <Accordion title="แผนด้านความสามารถ">
    plugin `qwen` กำลังถูกวางตำแหน่งให้เป็นบ้านของผู้ขายสำหรับพื้นผิวทั้งหมดของ Qwen
    Cloud ไม่ใช่แค่โมเดล coding/text

    - **โมเดลข้อความ/แชต:** bundled แล้วในตอนนี้
    - **Tool calling, structured output, thinking:** สืบทอดจากการขนส่งแบบเข้ากันได้กับ OpenAI
    - **การสร้างภาพ:** มีแผนในชั้น provider-plugin
    - **การเข้าใจภาพ/วิดีโอ:** bundled แล้วในตอนนี้บน endpoint Standard
    - **เสียง/ออดิโอ:** มีแผนในชั้น provider-plugin
    - **Memory embeddings/reranking:** มีแผนผ่านพื้นผิว embedding adapter
    - **การสร้างวิดีโอ:** bundled แล้วในตอนนี้ผ่าน capability การสร้างวิดีโอแบบใช้ร่วมกัน

  </Accordion>

  <Accordion title="รายละเอียดการสร้างวิดีโอ">
    สำหรับการสร้างวิดีโอ OpenClaw จะแมป region ของ Qwen ที่กำหนดไว้ไปยังโฮสต์
    DashScope AIGC ที่ตรงกันก่อนส่งงาน:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    ซึ่งหมายความว่า `models.providers.qwen.baseUrl` ปกติที่ชี้ไปยังโฮสต์
    Qwen แบบ Coding Plan หรือ Standard ก็ยังคงทำให้การสร้างวิดีโอไปยัง endpoint วิดีโอ DashScope ตามภูมิภาคที่ถูกต้องได้

    ข้อจำกัดการสร้างวิดีโอ Qwen แบบ bundled ในปัจจุบัน:

    - วิดีโอผลลัพธ์สูงสุด **1** รายการต่อคำขอ
    - รูปภาพอินพุตสูงสุด **1** รายการ
    - วิดีโออินพุตสูงสุด **4** รายการ
    - ระยะเวลาสูงสุด **10 วินาที**
    - รองรับ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
    - โหมด reference image/video ปัจจุบันต้องใช้ **URL http(s) ระยะไกล** เท่านั้น ระบบจะปฏิเสธ
      path ไฟล์ภายในเครื่องตั้งแต่ต้น เพราะ endpoint วิดีโอของ DashScope ไม่รองรับ
      การอัปโหลด buffer ของไฟล์ภายในเครื่องสำหรับ reference เหล่านั้น

  </Accordion>

  <Accordion title="ความเข้ากันได้ของการรายงาน usage ระหว่างสตรีม">
    endpoint Model Studio แบบเนทีฟประกาศความเข้ากันได้ของการรายงาน usage ระหว่างสตรีมบน
    การขนส่ง `openai-completions` แบบใช้ร่วมกัน ขณะนี้ OpenClaw อิงจาก capability ของ endpoint
    ดังนั้น custom provider id แบบเข้ากันได้กับ DashScope ที่ชี้ไปยังโฮสต์เนทีฟเดียวกันจะ
    สืบทอดพฤติกรรมการรายงาน usage ระหว่างสตรีมแบบเดียวกัน โดยไม่ต้อง
    ใช้ provider id `qwen` ที่มีมาในระบบโดยเฉพาะ

    ความเข้ากันได้ของการรายงาน usage ระหว่างสตรีมแบบเนทีฟใช้ได้ทั้งกับโฮสต์ Coding Plan และ
    โฮสต์ Standard แบบเข้ากันได้กับ DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="ภูมิภาคของ endpoint หลายสื่อ">
    พื้นผิวหลายสื่อ (การเข้าใจวิดีโอและการสร้างวิดีโอ Wan) ใช้
    endpoint DashScope แบบ **Standard** ไม่ใช่ endpoint ของ Coding Plan:

    - base URL ของ Standard แบบ Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - base URL ของ Standard แบบ China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="การตั้งค่า env และ daemon">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `QWEN_API_KEY` ถูก
    ส่งให้โปรเซสนั้นด้วย (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, ref ของโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของ tool วิดีโอแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/th/providers/alibaba" icon="cloud">
    provider ModelStudio แบบเดิมและหมายเหตุการย้ายระบบ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
