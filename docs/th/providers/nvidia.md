---
read_when:
    - คุณต้องการใช้โมเดลแบบเปิดใน OpenClaw ฟรี
    - คุณต้องตั้งค่า NVIDIA_API_KEY
summary: ใช้ API ของ NVIDIA ที่เข้ากันได้กับ OpenAI ใน OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA ให้บริการ API ที่เข้ากันได้กับ OpenAI ที่ `https://integrate.api.nvidia.com/v1` สำหรับ
โมเดลเปิดให้ใช้ฟรี ตรวจสอบสิทธิ์ด้วยคีย์ API จาก
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    สร้างคีย์ API ที่ [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="ส่งออกคีย์และรันการเริ่มต้นใช้งาน">
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
หากคุณส่ง `--nvidia-api-key` แทน env var ค่าดังกล่าวจะถูกบันทึกไว้ใน shell
history และเอาต์พุต `ps` ควรใช้ตัวแปรสภาพแวดล้อม `NVIDIA_API_KEY` เมื่อ
เป็นไปได้
</Warning>

สำหรับการตั้งค่าแบบไม่โต้ตอบ คุณยังสามารถส่งคีย์โดยตรงได้:

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

| ข้อมูลอ้างอิงโมเดล                     | ชื่อ                         | บริบท    | เอาต์พุตสูงสุด |
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
    แค็ตตาล็อกที่มาพร้อมกันเป็นแบบคงที่ ต้นทุนมีค่าเริ่มต้นเป็น `0` ในซอร์ส เนื่องจาก NVIDIA
    ขณะนี้ให้การเข้าถึง API ฟรีสำหรับโมเดลที่ระบุไว้
  </Accordion>

  <Accordion title="เอนด์พอยต์ที่เข้ากันได้กับ OpenAI">
    NVIDIA ใช้เอนด์พอยต์ completions มาตรฐาน `/v1` เครื่องมือใดๆ ที่เข้ากันได้กับ OpenAI
    ควรใช้งานได้ทันทีด้วย URL ฐานของ NVIDIA
  </Accordion>

  <Accordion title="การตอบกลับของผู้ให้บริการแบบกำหนดเองที่ช้า">
    โมเดลแบบกำหนดเองบางรายการที่โฮสต์บน NVIDIA อาจใช้เวลานานกว่า model idle
    watchdog เริ่มต้นก่อนที่จะปล่อยชิ้นส่วนการตอบกลับแรก สำหรับรายการผู้ให้บริการ NVIDIA
    แบบกำหนดเอง ให้เพิ่ม timeout ของผู้ให้บริการแทนการเพิ่ม timeout ของ runtime
    ของเอเจนต์ทั้งหมด:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
ขณะนี้โมเดล NVIDIA ใช้งานได้ฟรี ตรวจสอบ
[build.nvidia.com](https://build.nvidia.com/) สำหรับรายละเอียดความพร้อมใช้งานและ
rate limit ล่าสุด
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ ข้อมูลอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
