---
read_when:
    - คุณต้องการใช้โมเดลเปิดใน OpenClaw ฟรี
    - คุณต้องตั้งค่า NVIDIA_API_KEY
    - คุณต้องการใช้ Nemotron 3 Ultra ผ่าน NVIDIA
summary: ใช้ API ที่เข้ากันได้กับ OpenAI ของ NVIDIA ใน OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:38:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA ให้บริการ API ที่เข้ากันได้กับ OpenAI ที่ `https://integrate.api.nvidia.com/v1` สำหรับ
โมเดลเปิดใช้ฟรี ยืนยันตัวตนด้วยคีย์ API จาก
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) OpenClaw
ตั้งค่าเริ่มต้นของผู้ให้บริการ NVIDIA เป็น Nemotron 3 Ultra ซึ่งเป็นโมเดลให้เหตุผล
ของ NVIDIA ที่มีพารามิเตอร์รวม 550B / ทำงานจริง 55B สำหรับงานเชิงเอเจนต์แบบบริบทยาว

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    สร้างคีย์ API ที่ [build.nvidia.com](https://build.nvidia.com/settings/api-keys)
  </Step>
  <Step title="ส่งออกคีย์และรันการเริ่มต้นใช้งาน">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="ตั้งค่าโมเดล NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
หากคุณส่ง `--nvidia-api-key` แทนตัวแปรสภาพแวดล้อม ค่าจะไปอยู่ในประวัติ shell
และเอาต์พุต `ps` ควรใช้ตัวแปรสภาพแวดล้อม `NVIDIA_API_KEY` เมื่อ
เป็นไปได้
</Warning>

สำหรับการตั้งค่าแบบไม่โต้ตอบ คุณยังสามารถส่งคีย์โดยตรงได้ด้วย:

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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## แค็ตตาล็อกรายการแนะนำ

เมื่อกำหนดค่าคีย์ API ของ NVIDIA แล้ว เส้นทางการตั้งค่าและการเลือกโมเดลของ OpenClaw
จะลองใช้แค็ตตาล็อกโมเดลแนะนำสาธารณะของ NVIDIA จาก
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` และ
แคชผลลัพธ์ที่จัดอันดับไว้ 24 ชั่วโมง ดังนั้นโมเดลแนะนำใหม่จาก build.nvidia.com
จึงปรากฏในพื้นผิวการตั้งค่าและการเลือกโมเดลได้โดยไม่ต้องรอ
รุ่นเผยแพร่ของ OpenClaw เมื่อฟีดสดพร้อมใช้งาน โมเดลแรกที่ส่งคืนจะเป็น
ตัวเลือกเริ่มต้นที่แสดงระหว่างการตั้งค่า NVIDIA

การดึงข้อมูลใช้นโยบายโฮสต์ HTTPS แบบตายตัวสำหรับ `assets.ngc.nvidia.com` หากไม่ได้
กำหนดค่าคีย์ API ของ NVIDIA หรือหากแค็ตตาล็อกสาธารณะนั้นไม่พร้อมใช้งานหรือ
มีรูปแบบไม่ถูกต้อง OpenClaw จะกลับไปใช้แค็ตตาล็อกที่รวมมาและค่าเริ่มต้นที่รวมมาด้านล่าง

## Nemotron 3 Ultra

Nemotron 3 Ultra เป็นโมเดล NVIDIA เริ่มต้นใน OpenClaw หน้า build ของ NVIDIA สำหรับ
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
ระบุว่าเป็นเอนด์พอยต์ใช้ฟรีที่พร้อมใช้งาน พร้อมข้อกำหนดบริบท 1M โทเค็น
แค็ตตาล็อกที่รวมมาบันทึกเอาต์พุตสูงสุด 16,384 โทเค็นเพื่อให้ตรงกับคำขอตัวอย่าง
ที่เข้ากันได้กับ OpenAI ปัจจุบันของ NVIDIA สำหรับเอนด์พอยต์ที่โฮสต์อยู่

ใช้ Ultra สำหรับค่าเริ่มต้นของ NVIDIA ที่มีความสามารถสูงสุด เลือก Super ไว้เมื่อ
คุณต้องการตัวเลือก Nemotron 3 ที่เล็กกว่า หรือเลือกโมเดลของบุคคลที่สาม
ที่โฮสต์ในแค็ตตาล็อกของ NVIDIA เมื่อบริบท เวลาแฝง หรือพฤติกรรมของโมเดลเหล่านั้นเหมาะกว่า
แถว Ultra ที่รวมมาจะส่ง `chat_template_kwargs.enable_thinking: false` และ
`force_nonempty_content: true` ตามค่าเริ่มต้น เพื่อให้เอาต์พุตแชตปกติยังอยู่ใน
คำตอบที่มองเห็นได้แทนที่จะเปิดเผยข้อความการให้เหตุผล

## แค็ตตาล็อกสำรองที่รวมมา

| การอ้างอิงโมเดล                            | ชื่อ                         | บริบท    | เอาต์พุตสูงสุด | หมายเหตุ                         |
| ------------------------------------------ | ---------------------------- | --------- | -------------- | -------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384         | ค่าเริ่มต้น                      |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192          | ตัวสำรองรายการแนะนำ              |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192          | ตัวสำรองรายการแนะนำ              |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192          | ตัวสำรองรายการแนะนำ              |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192          | ตัวสำรองรายการแนะนำ              |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192          | เลิกใช้แล้ว, ความเข้ากันได้สำหรับการอัปเกรด |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192          | เลิกใช้แล้ว, ความเข้ากันได้สำหรับการอัปเกรด |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมการเปิดใช้อัตโนมัติ">
    ผู้ให้บริการจะเปิดใช้อัตโนมัติเมื่อมีการตั้งค่าตัวแปรสภาพแวดล้อม `NVIDIA_API_KEY`
    ไม่จำเป็นต้องมีการกำหนดค่าผู้ให้บริการแบบชัดเจนนอกเหนือจากคีย์
  </Accordion>

  <Accordion title="แค็ตตาล็อกและราคา">
    OpenClaw จะให้ความสำคัญกับแค็ตตาล็อกโมเดลแนะนำสาธารณะของ NVIDIA เมื่อมีการกำหนดค่า
    การยืนยันตัวตน NVIDIA และจะแคชไว้ 24 ชั่วโมง แค็ตตาล็อกสำรองที่รวมมาเป็นแบบคงที่
    และเก็บการอ้างอิงที่เผยแพร่แล้วซึ่งเลิกใช้เพื่อความเข้ากันได้สำหรับการอัปเกรด ค่าใช้จ่ายตั้งค่าเริ่มต้น
    เป็น `0` ในซอร์ส เนื่องจากปัจจุบัน NVIDIA ให้การเข้าถึง API ฟรีสำหรับ
    โมเดลที่ระบุไว้
  </Accordion>

  <Accordion title="เอนด์พอยต์ที่เข้ากันได้กับ OpenAI">
    NVIDIA ใช้เอนด์พอยต์ completions มาตรฐาน `/v1` เครื่องมือใด ๆ ที่เข้ากันได้กับ OpenAI
    ควรใช้งานได้ทันทีด้วย URL ฐานของ NVIDIA
  </Accordion>

  <Accordion title="พารามิเตอร์การให้เหตุผลของ Nemotron 3 Ultra">
    คำขอตัวอย่าง Ultra ของ NVIDIA ใช้ `chat_template_kwargs.enable_thinking`
    และ `reasoning_budget` สำหรับเอาต์พุตการให้เหตุผล แถว Ultra ที่รวมมากับ OpenClaw
    ปิดการคิดผ่านเทมเพลตตามค่าเริ่มต้นสำหรับการใช้งานแชตปกติ หากคุณต้องการ
    เลือกรับเอาต์พุตการให้เหตุผลของ NVIDIA หรือบังคับใช้ฟิลด์คำขอเฉพาะของ NVIDIA อื่น ๆ
    ให้ตั้งค่าพารามิเตอร์รายโมเดลและจำกัดโอเวอร์ไรด์เฉพาะผู้ให้บริการไว้ที่
    โมเดล NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` คือโอเวอร์ไรด์เนื้อหาคำขอขั้นสุดท้ายที่เข้ากันได้กับ OpenAI ดังนั้น
    ให้ใช้เฉพาะกับฟิลด์ที่ NVIDIA จัดทำเอกสารไว้สำหรับเอนด์พอยต์ที่เลือกเท่านั้น

  </Accordion>

  <Accordion title="การตอบสนองช้าจากผู้ให้บริการแบบกำหนดเอง">
    โมเดลแบบกำหนดเองบางรุ่นที่โฮสต์โดย NVIDIA อาจใช้เวลานานกว่าตัวเฝ้าระวังภาวะว่าง
    ของโมเดลเริ่มต้นก่อนที่จะส่งชิ้นส่วนคำตอบแรก สำหรับรายการผู้ให้บริการ NVIDIA แบบกำหนดเอง
    ให้เพิ่มระยะหมดเวลาของผู้ให้บริการแทนการเพิ่มระยะหมดเวลารันไทม์ของเอเจนต์ทั้งหมด:

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
ปัจจุบันโมเดล NVIDIA ใช้งานได้ฟรี ตรวจสอบ
[build.nvidia.com](https://build.nvidia.com/) เพื่อดูความพร้อมใช้งานล่าสุดและ
รายละเอียดขีดจำกัดอัตรา
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าแบบเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
