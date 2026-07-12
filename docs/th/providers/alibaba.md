---
read_when:
    - คุณต้องการใช้การสร้างวิดีโอด้วย Alibaba Wan ใน OpenClaw
    - คุณต้องตั้งค่าคีย์ API ของ Model Studio หรือ DashScope สำหรับการสร้างวิดีโอ
summary: การสร้างวิดีโอด้วย Wan ของ Alibaba Model Studio ใน OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T16:35:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Plugin `alibaba` ที่รวมมาในชุดจะลงทะเบียนผู้ให้บริการสร้างวิดีโอสำหรับโมเดล Wan บน Alibaba Model Studio (ชื่อสากลของ DashScope) โดยเปิดใช้งานเป็นค่าเริ่มต้น และต้องใช้เพียงคีย์ API เท่านั้น

| คุณสมบัติ                | ค่า                                                                             |
| ------------------------ | ------------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ         | `alibaba`                                                                       |
| Plugin                   | รวมมาในชุด, `enabledByDefault: true`                                             |
| ตัวแปรสภาพแวดล้อมการยืนยันตัวตน | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (ใช้ค่าที่ตรงกันค่าแรก) |
| แฟล็กการเริ่มต้นใช้งาน   | `--auth-choice alibaba-model-studio-api-key`                                    |
| แฟล็ก CLI โดยตรง         | `--alibaba-model-studio-api-key <key>`                                          |
| โมเดลเริ่มต้น            | `alibaba/wan2.6-t2v`                                                            |
| URL ฐานเริ่มต้น          | `https://dashscope-intl.aliyuncs.com`                                           |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    จัดเก็บคีย์สำหรับผู้ให้บริการ `alibaba` ผ่านขั้นตอนเริ่มต้นใช้งาน:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    หรือส่งคีย์โดยตรง:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    หรือส่งออกตัวแปรสภาพแวดล้อมที่รองรับตัวใดตัวหนึ่งก่อนเริ่ม Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # หรือ DASHSCOPE_API_KEY=...
    # หรือ QWEN_API_KEY=...
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
  <Step title="ตรวจสอบว่ากำหนดค่าผู้ให้บริการแล้ว">
    ```bash
    openclaw models list --provider alibaba
    ```

    รายการนี้ประกอบด้วยโมเดล Wan ที่รวมมาในชุดทั้งห้าโมเดล หากไม่สามารถหา `MODELSTUDIO_API_KEY` ได้ `openclaw models status --json` จะรายงานข้อมูลประจำตัวที่ขาดหายไปภายใต้ `auth.unusableProfiles`

  </Step>
</Steps>

<Note>
  ทั้ง Plugin Alibaba และ [Plugin Qwen](/th/providers/qwen) ยืนยันตัวตนกับ DashScope และรองรับตัวแปรสภาพแวดล้อมที่ทับซ้อนกัน ใช้รหัสโมเดล `alibaba/...` สำหรับส่วนการสร้างวิดีโอ Wan โดยเฉพาะ และใช้รหัส `qwen/...` สำหรับการสนทนา การฝังข้อมูล หรือการทำความเข้าใจสื่อของ Qwen
</Note>

## โมเดล Wan ในตัว

| การอ้างอิงโมเดล          | โหมด                         |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | ข้อความเป็นวิดีโอ (ค่าเริ่มต้น) |
| `alibaba/wan2.6-i2v`       | รูปภาพเป็นวิดีโอ              |
| `alibaba/wan2.6-r2v`       | ข้อมูลอ้างอิงเป็นวิดีโอ       |
| `alibaba/wan2.6-r2v-flash` | ข้อมูลอ้างอิงเป็นวิดีโอ (รวดเร็ว) |
| `alibaba/wan2.7-r2v`       | ข้อมูลอ้างอิงเป็นวิดีโอ       |

## ความสามารถและขีดจำกัด

ทั้งสามโหมดใช้ขีดจำกัดจำนวนวิดีโอและระยะเวลาต่อคำขอร่วมกัน โดยแตกต่างกันเฉพาะรูปแบบอินพุต

| โหมด                     | จำนวนวิดีโอเอาต์พุตสูงสุด | จำนวนรูปภาพอินพุตสูงสุด | จำนวนวิดีโออินพุตสูงสุด | ระยะเวลาสูงสุด | การควบคุมที่รองรับ                                        |
| ------------------------ | ----------------- | ---------------- | ---------------- | ------------ | --------------------------------------------------------- |
| ข้อความเป็นวิดีโอ        | 1                 | ไม่มี             | ไม่มี             | 10 วินาที    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| รูปภาพเป็นวิดีโอ         | 1                 | 1                | ไม่มี             | 10 วินาที    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| ข้อมูลอ้างอิงเป็นวิดีโอ  | 1                 | ไม่มี             | 4                | 10 วินาที    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

คำขอที่ไม่ได้ระบุ `durationSeconds` จะใช้ค่าเริ่มต้นที่ DashScope รองรับคือ **5 วินาที** ตั้งค่า `durationSeconds` อย่างชัดเจนใน[เครื่องมือสร้างวิดีโอ](/th/tools/video-generation) เพื่อขยายระยะเวลาได้สูงสุด 10 วินาที

<Warning>
  อินพุตรูปภาพและวิดีโออ้างอิงต้องเป็น URL ระยะไกลแบบ `http(s)` เนื่องจากโหมดอ้างอิงของ DashScope ปฏิเสธเส้นทางไฟล์ในเครื่อง ให้อัปโหลดไปยังพื้นที่จัดเก็บออบเจ็กต์ก่อน หรือใช้ขั้นตอนของ[เครื่องมือสื่อ](/th/tools/media-overview) ซึ่งสร้าง URL สาธารณะให้อยู่แล้ว
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="แทนที่ URL ฐานของ DashScope">
    ผู้ให้บริการใช้ปลายทาง DashScope ระหว่างประเทศเป็นค่าเริ่มต้น หากต้องการใช้ปลายทางสำหรับภูมิภาคจีน:

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

  <Accordion title="ลำดับความสำคัญของตัวแปรสภาพแวดล้อมการยืนยันตัวตน">
    OpenClaw จะหาคีย์ API ของ Alibaba จากตัวแปรสภาพแวดล้อมตามลำดับต่อไปนี้ โดยใช้ค่าที่ไม่ว่างค่าแรก:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    รายการ `auth.profiles` ที่กำหนดค่าไว้ (ตั้งค่าผ่าน `openclaw models auth login`) จะแทนที่การหาค่าจากตัวแปรสภาพแวดล้อม ดู[โปรไฟล์การยืนยันตัวตนในคำถามที่พบบ่อยเกี่ยวกับโมเดล](/th/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) สำหรับกลไกการหมุนเวียนโปรไฟล์ ช่วงพักการใช้งาน และการแทนที่ค่า

  </Accordion>

  <Accordion title="ความสัมพันธ์กับ Plugin Qwen">
    Plugin ที่รวมมาในชุดทั้งสองสื่อสารกับ DashScope และรองรับคีย์ API ที่ทับซ้อนกัน ใช้:

    - รหัส `alibaba/wan*.*` สำหรับผู้ให้บริการวิดีโอ Wan โดยเฉพาะตามที่อธิบายไว้ในหน้านี้
    - รหัส `qwen/*` สำหรับการสนทนา การฝังข้อมูล และการทำความเข้าใจสื่อของ Qwen (ดู [Qwen](/th/providers/qwen))

    การตั้งค่า `MODELSTUDIO_API_KEY` เพียงครั้งเดียวจะยืนยันตัวตนให้ Plugin ทั้งสอง เนื่องจากรายการตัวแปรสภาพแวดล้อมการยืนยันตัวตนทับซ้อนกันโดยเจตนา จึงไม่จำเป็นต้องเริ่มต้นใช้งาน Plugin แต่ละตัวแยกกัน

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Qwen" href="/th/providers/qwen" icon="microchip">
    การตั้งค่าการสนทนา การฝังข้อมูล และการทำความเข้าใจสื่อของ Qwen ด้วยการยืนยันตัวตน DashScope เดียวกัน
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์และการกำหนดค่าโมเดล
  </Card>
  <Card title="คำถามที่พบบ่อยเกี่ยวกับโมเดล" href="/th/help/faq-models" icon="circle-question">
    โปรไฟล์การยืนยันตัวตน การสลับโมเดล และการแก้ไขข้อผิดพลาด "ไม่มีโปรไฟล์"
  </Card>
</CardGroup>
