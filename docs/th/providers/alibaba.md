---
read_when:
    - คุณต้องการใช้การสร้างวิดีโอของ Alibaba Wan ใน OpenClaw
    - คุณต้องตั้งค่าคีย์ API ของ Model Studio หรือ DashScope สำหรับการสร้างวิดีโอ
summary: การสร้างวิดีโอด้วย Alibaba Model Studio Wan ใน OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T09:26:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw มาพร้อมกับ Plugin `alibaba` แบบบันเดิล ซึ่งลงทะเบียนผู้ให้บริการสร้างวิดีโอสำหรับโมเดล Wan บน Alibaba Model Studio (ชื่อสากลของ DashScope) Plugin นี้เปิดใช้งานตามค่าเริ่มต้น คุณเพียงต้องตั้งค่า API key เท่านั้น

| คุณสมบัติ | ค่า |
| ---------------- | ------------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ | `alibaba` |
| Plugin | บันเดิล, `enabledByDefault: true` |
| ตัวแปรสภาพแวดล้อมสำหรับ Auth | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (รายการแรกที่ตรงกันจะถูกใช้) |
| แฟล็ก onboarding | `--auth-choice alibaba-model-studio-api-key` |
| แฟล็ก CLI โดยตรง | `--alibaba-model-studio-api-key <key>` |
| โมเดลเริ่มต้น | `alibaba/wan2.6-t2v` |
| base URL เริ่มต้น | `https://dashscope-intl.aliyuncs.com` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    ใช้ onboarding เพื่อจัดเก็บคีย์กับผู้ให้บริการ `alibaba`:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    หรือส่งคีย์โดยตรงระหว่างการติดตั้ง/onboarding:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    หรือส่งออกตัวแปรสภาพแวดล้อมใดก็ได้ที่รองรับก่อนเริ่ม Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="ตั้งค่าโมเดลวิดีโอเริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่าผู้ให้บริการถูกกำหนดค่าแล้ว">
    ```bash
    openclaw models list --provider alibaba
    ```

    รายการควรมีโมเดล Wan แบบบันเดิลทั้งห้ารายการ หาก `MODELSTUDIO_API_KEY` ไม่สามารถ resolve ได้ `openclaw models status --json` จะรายงานข้อมูลประจำตัวที่หายไปใต้ `auth.unusableProfiles`

  </Step>
</Steps>

<Note>
  Plugin Alibaba และ [Plugin Qwen](/th/providers/qwen) ต่างก็ยืนยันตัวตนกับ DashScope และยอมรับตัวแปรสภาพแวดล้อมที่ซ้อนทับกัน ใช้รหัสโมเดล `alibaba/...` เพื่อขับเคลื่อนพื้นผิววิดีโอ Wan โดยเฉพาะ ใช้รหัส `qwen/...` เมื่อต้องการพื้นผิวแชต, embedding หรือการทำความเข้าใจสื่อของ Qwen
</Note>

## โมเดล Wan ในตัว

| การอ้างอิงโมเดล | โหมด |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v` | ข้อความเป็นวิดีโอ (ค่าเริ่มต้น) |
| `alibaba/wan2.6-i2v` | รูปภาพเป็นวิดีโอ |
| `alibaba/wan2.6-r2v` | การอ้างอิงเป็นวิดีโอ |
| `alibaba/wan2.6-r2v-flash` | การอ้างอิงเป็นวิดีโอ (เร็ว) |
| `alibaba/wan2.7-r2v` | การอ้างอิงเป็นวิดีโอ |

## ความสามารถและขีดจำกัด

ผู้ให้บริการแบบบันเดิลสะท้อนขีดจำกัด API วิดีโอ Wan ของ DashScope ทั้งสามโหมดใช้จำนวนวิดีโอต่อคำขอและขีดจำกัดระยะเวลาเดียวกัน ต่างกันเฉพาะรูปแบบอินพุต

| โหมด | จำนวนวิดีโอเอาต์พุตสูงสุด | จำนวนรูปภาพอินพุตสูงสุด | จำนวนวิดีโออินพุตสูงสุด | ระยะเวลาสูงสุด | การควบคุมที่รองรับ |
| ------------------ | ----------------- | ---------------- | ---------------- | ------------ | --------------------------------------------------------- |
| ข้อความเป็นวิดีโอ | 1 | n/a | n/a | 10 s | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| รูปภาพเป็นวิดีโอ | 1 | 1 | n/a | 10 s | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| การอ้างอิงเป็นวิดีโอ | 1 | n/a | 4 | 10 s | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

เมื่อคำขอไม่ได้ระบุ `durationSeconds` ผู้ให้บริการจะส่งค่าเริ่มต้นที่ DashScope ยอมรับคือ **5 วินาที** ตั้งค่า `durationSeconds` อย่างชัดเจนใน[เครื่องมือสร้างวิดีโอ](/th/tools/video-generation) เพื่อขยายได้สูงสุดถึง 10 s

<Warning>
  อินพุตรูปภาพและวิดีโออ้างอิงต้องเป็น URL ระยะไกลแบบ `http(s)` DashScope ไม่ยอมรับพาธไฟล์ภายในเครื่องในโหมดอ้างอิง ให้อัปโหลดไปยัง object storage ก่อน หรือใช้โฟลว์[เครื่องมือสื่อ](/th/tools/media-overview) ที่สร้าง URL สาธารณะอยู่แล้ว
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="แทนที่ base URL ของ DashScope">
    ผู้ให้บริการใช้ endpoint สากลของ DashScope เป็นค่าเริ่มต้น หากต้องการกำหนดเป้าหมาย endpoint ภูมิภาคจีน ให้ตั้งค่า:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    ผู้ให้บริการจะตัดเครื่องหมายทับท้ายออกก่อนสร้าง URL งาน AIGC

  </Accordion>

  <Accordion title="ลำดับความสำคัญของตัวแปรสภาพแวดล้อม Auth">
    OpenClaw resolve API key ของ Alibaba จากตัวแปรสภาพแวดล้อมตามลำดับนี้ โดยใช้ค่าแรกที่ไม่ว่าง:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    รายการ `auth.profiles` ที่กำหนดค่าไว้ (ตั้งค่าผ่าน `openclaw models auth login`) จะแทนที่การ resolve จากตัวแปรสภาพแวดล้อม ดู[โปรไฟล์ Auth ใน FAQ ของโมเดล](/th/help/faq-models#what-is-an-auth-profile) สำหรับกลไกการหมุนเวียนโปรไฟล์, cooldown และการแทนที่

  </Accordion>

  <Accordion title="ความสัมพันธ์กับ Plugin Qwen">
    Plugin แบบบันเดิลทั้งสองตัวสื่อสารกับ DashScope และยอมรับ API key ที่ซ้อนทับกัน ใช้:

    - รหัส `alibaba/wan*.*` เพื่อขับเคลื่อนผู้ให้บริการวิดีโอ Wan โดยเฉพาะที่อธิบายไว้ในหน้านี้
    - รหัส `qwen/*` สำหรับแชต, embedding และการทำความเข้าใจสื่อของ Qwen (ดู [Qwen](/th/providers/qwen))

    การตั้งค่า `MODELSTUDIO_API_KEY` ครั้งเดียวจะยืนยันตัวตนให้ทั้งสอง Plugin เพราะรายการตัวแปรสภาพแวดล้อม Auth ซ้อนทับกันโดยตั้งใจ คุณไม่จำเป็นต้องทำ onboarding ให้แต่ละ Plugin แยกกัน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Qwen" href="/th/providers/qwen" icon="microchip">
    การตั้งค่าแชต, embedding และการทำความเข้าใจสื่อของ Qwen บน Auth ของ DashScope เดียวกัน
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของ agent และการกำหนดค่าโมเดล
  </Card>
  <Card title="FAQ ของโมเดล" href="/th/help/faq-models" icon="circle-question">
    โปรไฟล์ Auth, การสลับโมเดล และการแก้ข้อผิดพลาด "no profile"
  </Card>
</CardGroup>
