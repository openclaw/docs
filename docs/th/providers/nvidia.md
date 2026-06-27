---
read_when:
    - คุณต้องการใช้โมเดลแบบเปิดใน OpenClaw ได้ฟรี
    - คุณต้องตั้งค่า NVIDIA_API_KEY
    - คุณต้องการใช้ Nemotron 3 Ultra ผ่าน NVIDIA
summary: ใช้ API ที่เข้ากันได้กับ OpenAI ของ NVIDIA ใน OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:14:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA มี API ที่เข้ากันได้กับ OpenAI ที่ `https://integrate.api.nvidia.com/v1` สำหรับ
โมเดลเปิดให้ใช้ฟรี ยืนยันตัวตนด้วยคีย์ API จาก
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) OpenClaw
ตั้งค่าเริ่มต้นของผู้ให้บริการ NVIDIA เป็น Nemotron 3 Ultra ซึ่งเป็นโมเดลเหตุผลแบบ active 55B / รวม 550B
ของ NVIDIA สำหรับงานเอเจนต์บริบทยาว

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Get your API key">
    สร้างคีย์ API ที่ [build.nvidia.com](https://build.nvidia.com/settings/api-keys)
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
หากคุณส่ง `--nvidia-api-key` แทนตัวแปรสภาพแวดล้อม ค่าจะไปอยู่ในประวัติ shell
และผลลัพธ์ `ps` ควรใช้ตัวแปรสภาพแวดล้อม `NVIDIA_API_KEY` เมื่อ
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

## แค็ตตาล็อกแนะนำ

เมื่อกำหนดค่าคีย์ API ของ NVIDIA แล้ว เส้นทางการตั้งค่าและการเลือกโมเดลของ OpenClaw
จะลองใช้แค็ตตาล็อกโมเดลแนะนำสาธารณะของ NVIDIA จาก
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` และ
แคชผลลัพธ์ที่จัดอันดับไว้ 24 ชั่วโมง ดังนั้นโมเดลแนะนำใหม่จาก build.nvidia.com
จึงปรากฏในพื้นผิวการตั้งค่าและการเลือกโมเดลได้โดยไม่ต้องรอ
รุ่นเผยแพร่ของ OpenClaw เมื่อฟีดสดพร้อมใช้งาน โมเดลแรกที่ส่งกลับมา
จะเป็นตัวเลือกเริ่มต้นที่แสดงระหว่างการตั้งค่า NVIDIA

การดึงข้อมูลใช้นโยบายโฮสต์ HTTPS แบบคงที่สำหรับ `assets.ngc.nvidia.com` หากไม่มีการ
กำหนดค่าคีย์ API ของ NVIDIA หรือหากแค็ตตาล็อกสาธารณะนั้นไม่พร้อมใช้งานหรือ
มีรูปแบบไม่ถูกต้อง OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่บันเดิลมาและค่าเริ่มต้นที่บันเดิลมาด้านล่าง

## Nemotron 3 Ultra

Nemotron 3 Ultra เป็นโมเดล NVIDIA เริ่มต้นใน OpenClaw หน้า build ของ NVIDIA สำหรับ
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
ระบุว่าเป็น endpoint ฟรีที่พร้อมใช้งานพร้อมข้อกำหนดบริบท 1M-token
แค็ตตาล็อกที่บันเดิลมาบันทึกเอาต์พุตสูงสุด 16,384 token เพื่อให้ตรงกับคำขอตัวอย่างแบบ
เข้ากันได้กับ OpenAI ปัจจุบันของ NVIDIA สำหรับ endpoint ที่โฮสต์อยู่

ใช้ Ultra สำหรับค่าเริ่มต้นของ NVIDIA ที่มีความสามารถสูงสุด เลือก Super ต่อไปเมื่อ
คุณต้องการตัวเลือก Nemotron 3 ที่เล็กกว่า หรือเลือกหนึ่งในโมเดลจากบุคคลที่สาม
ที่โฮสต์ในแค็ตตาล็อกของ NVIDIA เมื่อบริบท latency หรือพฤติกรรมของโมเดลเหล่านั้นเหมาะกว่า
แถว Ultra ที่บันเดิลมาส่ง `chat_template_kwargs.enable_thinking: false` และ
`force_nonempty_content: true` เป็นค่าเริ่มต้น เพื่อให้เอาต์พุตแชตปกติอยู่ใน
คำตอบที่มองเห็นได้แทนที่จะเปิดเผยข้อความเหตุผล

## แค็ตตาล็อก fallback ที่บันเดิลมา

| Model ref                                  | ชื่อ                         | บริบท   | เอาต์พุตสูงสุด | หมายเหตุ                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | ค่าเริ่มต้น                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192      | fallback แนะนำ                 |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | fallback แนะนำ                 |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | fallback แนะนำ                 |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | fallback แนะนำ                 |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | เลิกใช้แล้ว, ความเข้ากันได้สำหรับการอัปเกรด |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | เลิกใช้แล้ว, ความเข้ากันได้สำหรับการอัปเกรด |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    ผู้ให้บริการจะเปิดใช้งานอัตโนมัติเมื่อตั้งค่าตัวแปรสภาพแวดล้อม `NVIDIA_API_KEY`
    ไม่จำเป็นต้องมีการกำหนดค่าผู้ให้บริการอย่างชัดเจนนอกเหนือจากคีย์
  </Accordion>

  <Accordion title="Catalog and pricing">
    OpenClaw จะเลือกใช้แค็ตตาล็อกโมเดลแนะนำสาธารณะของ NVIDIA เมื่อมีการกำหนดค่า auth ของ NVIDIA
    และแคชไว้ 24 ชั่วโมง แค็ตตาล็อก fallback ที่บันเดิลมาเป็นแบบคงที่
    และเก็บ refs ที่เคยเผยแพร่แต่เลิกใช้แล้วไว้เพื่อความเข้ากันได้ในการอัปเกรด ค่าใช้จ่ายมีค่าเริ่มต้น
    เป็น `0` ในซอร์ส เนื่องจากปัจจุบัน NVIDIA ให้สิทธิ์เข้าถึง API ฟรีสำหรับ
    โมเดลที่ระบุไว้
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA ใช้ endpoint completions มาตรฐาน `/v1` เครื่องมือใด ๆ ที่เข้ากันได้กับ OpenAI
    ควรใช้งานได้ทันทีด้วย base URL ของ NVIDIA
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    คำขอตัวอย่าง Ultra ของ NVIDIA ใช้ `chat_template_kwargs.enable_thinking`
    และ `reasoning_budget` สำหรับเอาต์พุตเหตุผล แถว Ultra ที่บันเดิลมากับ OpenClaw
    ปิดใช้ template thinking เป็นค่าเริ่มต้นสำหรับการใช้งานแชตปกติ หากคุณต้องการ
    เลือกใช้เอาต์พุตเหตุผลของ NVIDIA หรือบังคับฟิลด์คำขอเฉพาะของ NVIDIA อื่น ๆ
    ให้ตั้งค่า params รายโมเดลและจำกัด overrides เฉพาะผู้ให้บริการไว้กับ
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

    `params.extra_body` คือ override ขั้นสุดท้ายของ request-body ที่เข้ากันได้กับ OpenAI ดังนั้น
    ให้ใช้เฉพาะกับฟิลด์ที่ NVIDIA จัดทำเอกสารไว้สำหรับ endpoint ที่เลือกเท่านั้น

  </Accordion>

  <Accordion title="Slow custom provider responses">
    โมเดล custom บางรุ่นที่โฮสต์โดย NVIDIA อาจใช้เวลานานกว่า watchdog idle ของโมเดลเริ่มต้น
    ก่อนจะส่ง chunk การตอบกลับแรก สำหรับรายการผู้ให้บริการ NVIDIA แบบ custom
    ให้เพิ่ม timeout ของผู้ให้บริการแทนการเพิ่ม timeout ของ runtime เอเจนต์
    ทั้งหมด:

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
[build.nvidia.com](https://build.nvidia.com/) สำหรับความพร้อมใช้งานล่าสุดและ
รายละเอียดขีดจำกัดอัตรา
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model refs และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าแบบเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
