---
read_when:
    - คุณต้องการใช้ Groq กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือเลือกการยืนยันตัวตนผ่าน CLI
    - คุณกำลังกำหนดค่าการถอดเสียงเสียงด้วย Whisper บน Groq
summary: การตั้งค่า Groq (การยืนยันตัวตน + การเลือกโมเดล + การถอดเสียงด้วย Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:13:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) ให้บริการ inference ความเร็วสูงมากบนโมเดล open-weight (Llama, Gemma, Kimi, Qwen, GPT OSS และอื่น ๆ) โดยใช้ฮาร์ดแวร์ LPU แบบกำหนดเอง Plugin ของ Groq ลงทะเบียนทั้งผู้ให้บริการแชตที่เข้ากันได้กับ OpenAI และผู้ให้บริการทำความเข้าใจสื่อเสียง

| คุณสมบัติ               | ค่า                                    |
| ---------------------- | ---------------------------------------- |
| รหัสผู้ให้บริการ            | `groq`                                   |
| Plugin                 | แพ็กเกจภายนอกอย่างเป็นทางการ                |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน           | `GROQ_API_KEY`                           |
| API                    | เข้ากันได้กับ OpenAI (`openai-completions`) |
| URL ฐาน               | `https://api.groq.com/openai/v1`         |
| การถอดเสียงเสียง    | `whisper-large-v3-turbo` (ค่าเริ่มต้น)       |
| ค่าเริ่มต้นแชตที่แนะนำ | `groq/llama-3.3-70b-versatile`           |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Get an API key">
    สร้างคีย์ API ที่ [console.groq.com/keys](https://console.groq.com/keys)
  </Step>
  <Step title="Set the API key">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify the catalog is reachable">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### ตัวอย่างไฟล์กำหนดค่า

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## แคตตาล็อกในตัว

OpenClaw มาพร้อมแคตตาล็อก Groq ที่มี manifest รองรับ โดยมีทั้งรายการที่ใช้ reasoning และไม่ใช้ reasoning เรียกใช้ `openclaw models list --provider groq` เพื่อดูแถวแบบคงที่สำหรับเวอร์ชันที่คุณติดตั้ง หรือดู [console.groq.com/docs/models](https://console.groq.com/docs/models) สำหรับรายการที่เป็นแหล่งข้อมูลหลักของ Groq

| อ้างอิงโมเดล                                        | ชื่อ                    | Reasoning | อินพุต        | บริบท |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | ไม่ใช่        | ข้อความ         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | ไม่ใช่        | ข้อความ         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | ไม่ใช่        | ข้อความ + รูปภาพ | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | ใช่       | ข้อความ         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | ใช่       | ข้อความ         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | ใช่       | ข้อความ         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | ใช่       | ข้อความ         | 131,072 |
| `groq/groq/compound`                             | Compound                | ใช่       | ข้อความ         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | ใช่       | ข้อความ         | 131,072 |

<Tip>
  แคตตาล็อกจะเปลี่ยนไปตามแต่ละรุ่นของ OpenClaw `openclaw models list --provider groq` แสดงแถวที่เวอร์ชันที่คุณติดตั้งรู้จัก ตรวจสอบเทียบกับ [console.groq.com/docs/models](https://console.groq.com/docs/models) สำหรับโมเดลที่เพิ่มใหม่หรือเลิกใช้แล้ว
</Tip>

## โมเดล reasoning

OpenClaw จับคู่ระดับ `/think` ร่วมของตัวเองเข้ากับค่า `reasoning_effort` เฉพาะโมเดลของ Groq:

- สำหรับ `qwen/qwen3-32b` การปิดการคิดจะส่ง `none` และการเปิดการคิดจะส่ง `default`
- สำหรับโมเดล reasoning ของ Groq GPT OSS (`openai/gpt-oss-*`) OpenClaw จะส่ง `low`, `medium` หรือ `high` ตามระดับ `/think` การปิดการคิดจะละเว้น `reasoning_effort` เพราะโมเดลเหล่านี้ไม่รองรับค่าปิดใช้งาน
- DeepSeek R1 Distill, Qwen QwQ และ Compound ใช้พื้นผิว reasoning แบบเนทีฟของ Groq; `/think` ควบคุมการมองเห็น แต่โมเดลจะใช้ reasoning เสมอ

ดู [โหมดการคิด](/th/tools/thinking) สำหรับระดับ `/think` ร่วมและวิธีที่ OpenClaw แปลระดับเหล่านี้ตามผู้ให้บริการแต่ละราย

## การถอดเสียงเสียง

Plugin ของ Groq ยังลงทะเบียน **ผู้ให้บริการทำความเข้าใจสื่อเสียง** เพื่อให้ถอดเสียงข้อความเสียงผ่านพื้นผิว `tools.media.audio` ร่วมได้

| คุณสมบัติ           | ค่า                                     |
| ------------------ | ----------------------------------------- |
| พาธกำหนดค่าร่วม | `tools.media.audio`                       |
| URL ฐานเริ่มต้น   | `https://api.groq.com/openai/v1`          |
| โมเดลเริ่มต้น      | `whisper-large-v3-turbo`                  |
| ลำดับความสำคัญอัตโนมัติ      | 20                                        |
| เอนด์พอยต์ API       | เข้ากันได้กับ OpenAI `/audio/transcriptions` |

เพื่อกำหนดให้ Groq เป็นแบ็กเอนด์เสียงเริ่มต้น:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Environment availability for the daemon">
    หาก Gateway ทำงานเป็นบริการที่มีการจัดการ (launchd, systemd, Docker) `GROQ_API_KEY` ต้องมองเห็นได้จากกระบวนการนั้น ไม่ใช่เฉพาะจากเชลล์แบบโต้ตอบของคุณ

    <Warning>
      คีย์ที่ export เฉพาะในเชลล์แบบโต้ตอบจะไม่ช่วย daemon ของ launchd หรือ systemd เว้นแต่สภาพแวดล้อมนั้นจะถูกนำเข้าไปที่นั่นด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้กระบวนการ gateway อ่านได้
    </Warning>

  </Accordion>

  <Accordion title="Custom Groq model ids">
    OpenClaw ยอมรับรหัสโมเดล Groq ใด ๆ ในขณะรันไทม์ ใช้รหัสที่ Groq แสดงอย่างถูกต้องทุกตัวอักษร และเติมคำนำหน้าด้วย `groq/` แคตตาล็อกแบบคงที่ครอบคลุมกรณีทั่วไป ส่วนรหัสที่ไม่มีในแคตตาล็อกจะส่งต่อไปยังเทมเพลตเริ่มต้นที่เข้ากันได้กับ OpenAI

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ อ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="Thinking modes" href="/th/tools/thinking" icon="brain">
    ระดับความพยายามด้าน reasoning และการโต้ตอบกับนโยบายของผู้ให้บริการ
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    schema กำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการและเสียง
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Groq, เอกสาร API และราคา
  </Card>
</CardGroup>
