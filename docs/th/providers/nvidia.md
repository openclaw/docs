---
read_when:
    - คุณต้องการใช้โมเดลแบบเปิดใน OpenClaw โดยไม่มีค่าใช้จ่าย
    - คุณต้องตั้งค่า NVIDIA_API_KEY
summary: ใช้ API ที่เข้ากันได้กับ OpenAI ของ NVIDIA ใน OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T10:12:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA ให้บริการ API ที่เข้ากันได้กับ OpenAI ที่ `https://integrate.api.nvidia.com/v1` สำหรับ
โมเดลแบบเปิดให้ใช้ฟรี ตรวจสอบสิทธิ์ด้วยคีย์ API จาก
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    สร้างคีย์ API ที่ [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="ส่งออกคีย์และเรียกใช้การเริ่มต้นใช้งาน">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="ตั้งค่าโมเดล NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
หากคุณส่ง `--nvidia-api-key` แทน env var ค่าจะถูกบันทึกลงในประวัติ shell
และเอาต์พุต `ps` ควรใช้ตัวแปรสภาพแวดล้อม `NVIDIA_API_KEY` เมื่อ
เป็นไปได้
</Warning>

สำหรับการตั้งค่าแบบไม่โต้ตอบ คุณยังสามารถส่งคีย์โดยตรงได้เช่นกัน:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## แค็ตตาล็อกในตัว

| อ้างอิงโมเดล                              | ชื่อ                         | บริบท   | เอาต์พุตสูงสุด |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมการเปิดใช้งานอัตโนมัติ">
    ผู้ให้บริการจะเปิดใช้งานโดยอัตโนมัติเมื่อตั้งค่าตัวแปรสภาพแวดล้อม `NVIDIA_API_KEY`
    ไม่จำเป็นต้องมีการกำหนดค่าผู้ให้บริการอย่างชัดเจนนอกเหนือจากคีย์
  </Accordion>

  <Accordion title="แค็ตตาล็อกและราคา">
    แค็ตตาล็อกที่รวมมาด้วยเป็นแบบคงที่ ค่าใช้จ่ายมีค่าเริ่มต้นเป็น `0` ในซอร์ส เนื่องจาก NVIDIA
    ปัจจุบันให้สิทธิ์เข้าถึง API ฟรีสำหรับโมเดลที่ระบุไว้
  </Accordion>

  <Accordion title="ปลายทางที่เข้ากันได้กับ OpenAI">
    NVIDIA ใช้ปลายทาง completions มาตรฐาน `/v1` เครื่องมือใดๆ ที่เข้ากันได้กับ OpenAI
    ควรใช้งานได้ทันทีเมื่อใช้ URL ฐานของ NVIDIA
  </Accordion>
</AccordionGroup>

<Tip>
ปัจจุบันโมเดล NVIDIA ใช้งานได้ฟรี ตรวจสอบ
[build.nvidia.com](https://build.nvidia.com/) สำหรับรายละเอียดความพร้อมใช้งานล่าสุดและ
ขีดจำกัดอัตรา
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ อ้างอิงโมเดล และพฤติกรรมการสลับไปใช้สำรอง
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าแบบเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
