---
read_when:
    - คุณต้องการใช้ Groq กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนของ CLI
    - คุณกำลังกำหนดค่าการถอดเสียงด้วย Whisper บน Groq
summary: การตั้งค่า Groq (การยืนยันตัวตน + การเลือกโมเดล + การถอดเสียงด้วย Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T16:35:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) ให้บริการการอนุมานที่รวดเร็วเป็นพิเศษบนโมเดลแบบเปิดเผยน้ำหนัก (Llama, Gemma, Kimi, Qwen, GPT OSS และอื่น ๆ) โดยใช้ฮาร์ดแวร์ LPU ที่ออกแบบเฉพาะ Plugin Groq ลงทะเบียนทั้งผู้ให้บริการแชตที่เข้ากันได้กับ OpenAI และผู้ให้บริการทำความเข้าใจสื่อเสียง

| คุณสมบัติ                 | ค่า                                      |
| ---------------------- | ---------------------------------------- |
| รหัสผู้ให้บริการ           | `groq`                                   |
| Plugin                 | แพ็กเกจภายนอกอย่างเป็นทางการ                 |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน | `GROQ_API_KEY`                           |
| API                    | เข้ากันได้กับ OpenAI (`openai-completions`) |
| URL ฐาน                | `https://api.groq.com/openai/v1`         |
| การถอดเสียง             | `whisper-large-v3-turbo` (ค่าเริ่มต้น)       |
| ค่าเริ่มต้นของแชตที่แนะนำ   | `groq/llama-3.3-70b-versatile`           |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ที่ [console.groq.com/keys](https://console.groq.com/keys)
  </Step>
  <Step title="ตั้งค่าคีย์ API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
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
  <Step title="ตรวจสอบว่าสามารถเข้าถึงแค็ตตาล็อกได้">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### ตัวอย่างไฟล์การกำหนดค่า

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

## แค็ตตาล็อกในตัว

OpenClaw มาพร้อมแค็ตตาล็อก Groq ที่อ้างอิงจากไฟล์รายการ ซึ่งมีทั้งรายการโมเดลที่ใช้การให้เหตุผลและไม่ใช้การให้เหตุผล เรียกใช้ `openclaw models list --provider groq` เพื่อดูแถวข้อมูลแบบคงที่สำหรับเวอร์ชันที่ติดตั้ง หรือดูรายการอ้างอิงอย่างเป็นทางการของ Groq ที่ [console.groq.com/docs/models](https://console.groq.com/docs/models)

| การอ้างอิงโมเดล                                  | ชื่อ                     | การให้เหตุผล | อินพุต       | บริบท   |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | ไม่        | ข้อความ      | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | ไม่        | ข้อความ      | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | ไม่        | ข้อความ + รูปภาพ | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | ใช่        | ข้อความ      | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | ใช่        | ข้อความ      | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | ใช่        | ข้อความ      | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | ใช่        | ข้อความ      | 131,072 |
| `groq/groq/compound`                             | Compound                | ใช่        | ข้อความ      | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | ใช่        | ข้อความ      | 131,072 |

<Tip>
  แค็ตตาล็อกมีการพัฒนาไปพร้อมกับ OpenClaw แต่ละรุ่น `openclaw models list --provider groq` จะแสดงแถวข้อมูลที่เวอร์ชันซึ่งติดตั้งรู้จัก โปรดตรวจสอบเทียบกับ [console.groq.com/docs/models](https://console.groq.com/docs/models) สำหรับโมเดลที่เพิ่มใหม่หรือเลิกใช้งานแล้ว
</Tip>

## โมเดลการให้เหตุผล

โมเดลการให้เหตุผลของ Groq (`reasoning: true` ในตารางด้านบน) จะแมประดับ `/think` ที่ใช้ร่วมกันของ OpenClaw ไปเป็นค่า `reasoning_effort` ได้แก่ `low`, `medium` หรือ `high` ส่วน `/think off` หรือ `/think none` จะละ `reasoning_effort` ออกจากคำขอแทนการส่งค่าที่ปิดใช้งาน

ดู [โหมดการคิด](/th/tools/thinking) สำหรับระดับ `/think` ที่ใช้ร่วมกัน และวิธีที่ OpenClaw แปลงค่าเหล่านี้สำหรับผู้ให้บริการแต่ละราย

## การถอดเสียง

Plugin ของ Groq ยังลงทะเบียน **ผู้ให้บริการทำความเข้าใจสื่อเสียง** เพื่อให้สามารถถอดเสียงข้อความเสียงผ่านพื้นผิว `tools.media.audio` ที่ใช้ร่วมกันได้

| คุณสมบัติ              | ค่า                                       |
| ------------------ | ----------------------------------------- |
| พาธการกำหนดค่าที่ใช้ร่วมกัน | `tools.media.audio`                       |
| URL ฐานเริ่มต้น       | `https://api.groq.com/openai/v1`          |
| โมเดลเริ่มต้น         | `whisper-large-v3-turbo`                  |
| ลำดับความสำคัญอัตโนมัติ | 20                                        |
| ปลายทาง API         | `/audio/transcriptions` ที่เข้ากันได้กับ OpenAI |

หากต้องการกำหนดให้ Groq เป็นระบบประมวลผลเสียงเริ่มต้น:

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
  <Accordion title="ความพร้อมใช้งานของสภาพแวดล้อมสำหรับดีมอน">
    หาก Gateway ทำงานเป็นบริการที่มีการจัดการ (launchd, systemd, Docker) กระบวนการนั้นต้องมองเห็น `GROQ_API_KEY` ไม่ใช่เฉพาะเชลล์แบบโต้ตอบของคุณ

    <Warning>
      คีย์ที่ส่งออกเฉพาะในเชลล์แบบโต้ตอบจะไม่ช่วยดีมอน launchd หรือ systemd เว้นแต่จะนำเข้าสภาพแวดล้อมนั้นไปด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้กระบวนการ Gateway อ่านได้
    </Warning>

  </Accordion>

  <Accordion title="รหัสโมเดล Groq แบบกำหนดเอง">
    OpenClaw ยอมรับรหัสโมเดล Groq ใด ๆ ขณะทำงาน ใช้รหัสที่ Groq แสดงอย่างตรงกันทุกประการและเติม `groq/` ไว้ด้านหน้า แค็ตตาล็อกแบบคงที่ครอบคลุมกรณีทั่วไป ส่วนรหัสที่ไม่มีในแค็ตตาล็อกจะใช้เทมเพลตเริ่มต้นที่เข้ากันได้กับ OpenAI

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

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="โหมดการคิด" href="/th/tools/thinking" icon="brain">
    ระดับความพยายามในการให้เหตุผลและการทำงานร่วมกับนโยบายของผู้ให้บริการ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าแบบเต็ม รวมถึงการตั้งค่าผู้ให้บริการและเสียง
  </Card>
  <Card title="คอนโซล Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Groq เอกสาร API และราคา
  </Card>
</CardGroup>
