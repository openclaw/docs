---
read_when:
    - คุณต้องการใช้โมเดลแบบเปิดใน OpenClaw โดยไม่เสียค่าใช้จ่าย
    - คุณต้องตั้งค่า NVIDIA_API_KEY
    - คุณต้องการใช้ Nemotron 3 Ultra ผ่าน NVIDIA
summary: ใช้ API ที่เข้ากันได้กับ OpenAI ของ NVIDIA ใน OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T16:35:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA ให้บริการโมเดลแบบเปิดโดยไม่มีค่าใช้จ่ายผ่าน API ที่เข้ากันได้กับ OpenAI ที่
`https://integrate.api.nvidia.com/v1` โดยยืนยันตัวตนด้วยคีย์ API จาก
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) OpenClaw
กำหนดให้ Nemotron 3 Ultra เป็นค่าเริ่มต้นของผู้ให้บริการ NVIDIA ซึ่งเป็นโมเดลการให้เหตุผลของ NVIDIA
ที่มีพารามิเตอร์รวม 550B พารามิเตอร์ที่ทำงาน 55B และออกแบบมาสำหรับงานแบบเอเจนต์
ที่ใช้บริบทยาว

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ที่ [build.nvidia.com](https://build.nvidia.com/settings/api-keys)
  </Step>
  <Step title="ส่งออกคีย์และเริ่มกระบวนการตั้งค่า">
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

สำหรับการตั้งค่าแบบไม่โต้ตอบ ให้ส่งคีย์โดยตรง:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` จะทำให้คีย์ปรากฏในประวัติของเชลล์และผลลัพธ์จาก `ps` หากเป็นไปได้
ควรใช้ตัวแปรสภาพแวดล้อม `NVIDIA_API_KEY`
</Warning>

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

## แค็ตตาล็อกโมเดลแนะนำ

เมื่อกำหนดค่าคีย์ API ของ NVIDIA แล้ว เส้นทางการตั้งค่าและการเลือกโมเดลจะดึง
แค็ตตาล็อกโมเดลแนะนำสาธารณะของ NVIDIA จาก
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` และ
แคชผลลัพธ์ไว้ 24 ชั่วโมง (32 รายการแรกจะถูกนำเข้าเป็นแถวที่รองรับอินพุตข้อความ
โดยไม่มีค่าใช้จ่าย) ดังนั้นโมเดลแนะนำใหม่จาก build.nvidia.com จึงปรากฏในหน้าการตั้งค่า
และการเลือกโมเดลได้โดยไม่ต้องรอ OpenClaw รุ่นใหม่ เมื่อฟีดสดพร้อมใช้งาน
โมเดลแรกที่ส่งกลับมาจะเป็นตัวเลือกที่เลือกล่วงหน้าระหว่างการตั้งค่า NVIDIA

การดึงข้อมูลใช้นโยบายโฮสต์ HTTPS แบบตายตัวสำหรับ `assets.ngc.nvidia.com` หากยังไม่ได้
กำหนดค่าคีย์ API ของ NVIDIA หรือฟีดไม่พร้อมใช้งานหรือมีรูปแบบไม่ถูกต้อง
OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกและค่าเริ่มต้นที่รวมมาให้ด้านล่าง

## Nemotron 3 Ultra

Nemotron 3 Ultra เป็นโมเดล NVIDIA เริ่มต้นใน OpenClaw หน้าสำหรับสร้างของ NVIDIA สำหรับ
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
ระบุว่าเป็นปลายทางฟรีที่พร้อมใช้งาน โดยมีข้อกำหนดบริบทขนาด 1 ล้านโทเค็น

แถว Ultra ที่รวมมาให้จะส่ง
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
เป็นค่าเริ่มต้น เพื่อให้เอาต์พุตแชตตามปกติยังคงอยู่ในคำตอบที่มองเห็นได้ แทนที่จะ
เปิดเผยข้อความการให้เหตุผล

ใช้ Ultra เมื่อต้องการค่าเริ่มต้นของ NVIDIA ที่มีความสามารถสูงสุด เลือก Super ต่อไปเมื่อ
คุณต้องการตัวเลือก Nemotron 3 ที่เล็กกว่า หรือเลือกหนึ่งในโมเดลจากบุคคลที่สาม
ที่โฮสต์ในแค็ตตาล็อกของ NVIDIA เมื่อบริบท เวลาแฝง หรือพฤติกรรมของโมเดลนั้นเหมาะสมกว่า

## แค็ตตาล็อกสำรองที่รวมมาให้

แถวที่เลือกได้ซึ่งรวมมาให้เป็นสแนปช็อตของแค็ตตาล็อกโมเดลแนะนำของ NVIDIA แถวความเข้ากันได้
ที่เลิกใช้แล้วจะยังคงแก้ไขได้ด้วยการอ้างอิงที่ตรงกันทุกประการ แต่จะไม่แสดงใน
เครื่องมือเลือกโมเดล

| การอ้างอิงโมเดล                           | ชื่อ                  | บริบท     | เอาต์พุตสูงสุด |
| ------------------------------------------ | --------------------- | --------- | -------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192          |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192          |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192          |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192          |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192          |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384         |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384         |

แค็ตตาล็อกความเข้ากันได้ฉบับเต็มยังคงเก็บการอ้างอิงที่เผยแพร่แล้วต่อไปนี้ไว้สำหรับ
การกำหนดค่าที่มีอยู่: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` และ
`nvidia/minimaxai/minimax-m2.7` รายการเหล่านี้ยังคงใช้งานได้ด้วยการอ้างอิงที่ตรงกันทุกประการ
แต่จะไม่ปรากฏในการเริ่มกระบวนการตั้งค่าหรือเครื่องมือเลือกโมเดล

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมการเปิดใช้งานอัตโนมัติ">
    ผู้ให้บริการจะเปิดใช้งานโดยอัตโนมัติเมื่อตั้งค่าตัวแปรสภาพแวดล้อม `NVIDIA_API_KEY`
    หรือมีการจัดเก็บคีย์ระหว่างการเริ่มกระบวนการตั้งค่า นอกเหนือจากคีย์แล้ว
    ไม่จำเป็นต้องกำหนดค่าผู้ให้บริการอย่างชัดเจน
  </Accordion>

  <Accordion title="แค็ตตาล็อกและราคา">
    OpenClaw จะเลือกใช้แค็ตตาล็อกโมเดลแนะนำสาธารณะของ NVIDIA เมื่อกำหนดค่า
    การยืนยันตัวตนของ NVIDIA แล้ว และจะแคชไว้ 24 ชั่วโมง แค็ตตาล็อกสำรองที่เลือกได้
    ซึ่งรวมมาให้เป็นสแนปช็อตคงที่ของแค็ตตาล็อกโมเดลแนะนำของ NVIDIA ส่วนแถวความเข้ากันได้
    ที่เลิกใช้แล้วและต้องอ้างอิงให้ตรงกันทุกประการจะถูกซ่อนจากเครื่องมือเลือกโมเดล
    ค่าใช้จ่ายในซอร์สมีค่าเริ่มต้นเป็น `0` เนื่องจากปัจจุบัน NVIDIA ให้สิทธิ์เข้าถึง API
    โดยไม่มีค่าใช้จ่ายสำหรับโมเดลที่ระบุไว้
  </Accordion>

  <Accordion title="ปลายทางที่เข้ากันได้กับ OpenAI">
    OpenClaw สื่อสารกับ NVIDIA โดยใช้อะแดปเตอร์ `openai-completions` ผ่านเส้นทาง
    การเติมข้อความแชตมาตรฐาน `/v1` เครื่องมือใดก็ตามที่เข้ากันได้กับ OpenAI
    ควรใช้งานได้ทันทีด้วย URL ฐานของ NVIDIA
  </Accordion>

  <Accordion title="พารามิเตอร์การให้เหตุผลของ Nemotron 3 Ultra">
    คำขอตัวอย่าง Ultra ของ NVIDIA ใช้ `chat_template_kwargs.enable_thinking`
    และ `reasoning_budget` สำหรับเอาต์พุตการให้เหตุผล แถว Ultra ที่ OpenClaw รวมมาให้
    จะปิดการคิดผ่านเทมเพลตเป็นค่าเริ่มต้นสำหรับการใช้งานแชตทั่วไป หากคุณต้องการ
    เลือกใช้เอาต์พุตการให้เหตุผลของ NVIDIA หรือบังคับใช้ฟิลด์คำขออื่นเฉพาะของ NVIDIA
    ให้ตั้งค่าพารามิเตอร์ต่อโมเดล และจำกัดขอบเขตการแทนที่เฉพาะผู้ให้บริการไว้ที่
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

    `params.chat_template_kwargs` จะผสานเข้ากับ `chat_template_kwargs` ใด ๆ
    ที่มีอยู่แล้วในคำขอ แทนที่จะแทนที่ออบเจ็กต์ทั้งหมด
    `params.extra_body` เป็นการแทนที่เนื้อหาคำขอขั้นสุดท้ายที่เข้ากันได้กับ OpenAI
    และจะเขียนทับคีย์เพย์โหลดที่ซ้ำกัน ดังนั้นให้ใช้เฉพาะกับฟิลด์ที่ NVIDIA
    ระบุไว้ในเอกสารสำหรับปลายทางที่เลือกเท่านั้น

  </Accordion>

  <Accordion title="การตอบสนองที่ช้าจากผู้ให้บริการแบบกำหนดเอง">
    โมเดลแบบกำหนดเองบางรุ่นที่โฮสต์โดย NVIDIA อาจใช้เวลานานกว่าตัวเฝ้าระวัง
    การไม่มีการใช้งานของโมเดลค่าเริ่มต้นประมาณ 120 วินาที ก่อนจะปล่อยส่วนแรกของการตอบกลับ
    สำหรับรายการผู้ให้บริการ NVIDIA แบบกำหนดเอง ให้เพิ่มระยะหมดเวลาของผู้ให้บริการ
    แทนที่จะเพิ่มระยะหมดเวลาของรันไทม์เอเจนต์ทั้งหมด `timeoutSeconds` ครอบคลุมคำขอ HTTP
    ของผู้ให้บริการ และเพิ่มเพดานตัวเฝ้าระวังการไม่มีการใช้งาน/สตรีมสำหรับผู้ให้บริการนั้น:

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
ขณะนี้โมเดล NVIDIA ใช้งานได้โดยไม่มีค่าใช้จ่าย ตรวจสอบ
[build.nvidia.com](https://build.nvidia.com/) สำหรับรายละเอียดล่าสุดเกี่ยวกับความพร้อมใช้งาน
และขีดจำกัดอัตราการใช้งาน
</Tip>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
