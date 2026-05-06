---
read_when:
    - คุณต้องการใช้ Groq กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือเลือกการยืนยันตัวตนผ่าน CLI
    - คุณกำลังกำหนดค่าการถอดเสียงด้วย Whisper บน Groq
summary: การตั้งค่า Groq (การยืนยันตัวตน + การเลือกโมเดล + การถอดเสียงด้วย Whisper)
title: Groq
x-i18n:
    generated_at: "2026-05-06T09:28:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) ให้บริการอนุมานความเร็วสูงมากบนโมเดล open-weight (Llama, Gemma, Kimi, Qwen, GPT OSS และอื่นๆ) โดยใช้ฮาร์ดแวร์ LPU แบบกำหนดเอง OpenClaw มี Groq plugin ที่รวมมาให้ ซึ่งลงทะเบียนทั้งผู้ให้บริการแชตที่เข้ากันได้กับ OpenAI และผู้ให้บริการทำความเข้าใจสื่อเสียง

| คุณสมบัติ               | ค่า                                    |
| ---------------------- | ---------------------------------------- |
| รหัสผู้ให้บริการ            | `groq`                                   |
| Plugin                 | รวมมาให้, `enabledByDefault: true`        |
| ตัวแปร env สำหรับการยืนยันตัวตน           | `GROQ_API_KEY`                           |
| แฟล็กการเริ่มต้นใช้งาน        | `--auth-choice groq-api-key`             |
| API                    | เข้ากันได้กับ OpenAI (`openai-completions`) |
| URL ฐาน               | `https://api.groq.com/openai/v1`         |
| การถอดเสียงเสียง    | `whisper-large-v3-turbo` (ค่าเริ่มต้น)       |
| ค่าเริ่มต้นที่แนะนำสำหรับแชต | `groq/llama-3.3-70b-versatile`           |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ที่ [console.groq.com/keys](https://console.groq.com/keys)
  </Step>
  <Step title="ตั้งค่าคีย์ API">
    <CodeGroup>

```bash การเริ่มต้นใช้งาน
openclaw onboard --auth-choice groq-api-key
```

```bash เฉพาะ Env
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

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
  <Step title="ตรวจสอบว่าเข้าถึงแค็ตตาล็อกได้">
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

OpenClaw มาพร้อมแค็ตตาล็อก Groq ที่อิงกับ manifest พร้อมรายการทั้งแบบใช้ reasoning และไม่ใช้ reasoning เรียกใช้ `openclaw models list --provider groq` เพื่อดูแถวที่รวมมาให้สำหรับเวอร์ชันที่คุณติดตั้ง หรือดู [console.groq.com/docs/models](https://console.groq.com/docs/models) สำหรับรายการอย่างเป็นทางการของ Groq

| การอ้างอิงโมเดล                                            | ชื่อ                          | Reasoning | อินพุต        | บริบท |
| ---------------------------------------------------- | ----------------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | ไม่ใช่        | ข้อความ         | 131,072 |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | ไม่ใช่        | ข้อความ         | 131,072 |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | ไม่ใช่        | ข้อความ + รูปภาพ | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | ไม่ใช่        | ข้อความ + รูปภาพ | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | ไม่ใช่        | ข้อความ         | 8,192   |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | ไม่ใช่        | ข้อความ         | 8,192   |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | ไม่ใช่        | ข้อความ         | 8,192   |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | ไม่ใช่        | ข้อความ         | 32,768  |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | ไม่ใช่        | ข้อความ         | 131,072 |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | ไม่ใช่        | ข้อความ         | 262,144 |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | ใช่       | ข้อความ         | 131,072 |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | ใช่       | ข้อความ         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | ใช่       | ข้อความ         | 131,072 |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | ใช่       | ข้อความ         | 131,072 |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | ใช่       | ข้อความ         | 131,072 |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | ใช่       | ข้อความ         | 131,072 |
| `groq/groq/compound`                                 | Compound                      | ใช่       | ข้อความ         | 131,072 |
| `groq/groq/compound-mini`                            | Compound Mini                 | ใช่       | ข้อความ         | 131,072 |

<Tip>
  แค็ตตาล็อกพัฒนาไปพร้อมกับ OpenClaw แต่ละรุ่น `openclaw models list --provider groq` จะแสดงแถวที่เวอร์ชันที่คุณติดตั้งรู้จัก ตรวจสอบเทียบกับ [console.groq.com/docs/models](https://console.groq.com/docs/models) สำหรับโมเดลที่เพิ่งเพิ่มหรือเลิกใช้แล้ว
</Tip>

## โมเดล Reasoning

OpenClaw แมประดับ `/think` ที่ใช้ร่วมกันไปยังค่า `reasoning_effort` เฉพาะโมเดลของ Groq:

- สำหรับ `qwen/qwen3-32b` การปิดการคิดจะส่ง `none` และการเปิดการคิดจะส่ง `default`
- สำหรับโมเดล reasoning ของ Groq GPT OSS (`openai/gpt-oss-*`) OpenClaw จะส่ง `low`, `medium` หรือ `high` ตามระดับ `/think` การปิดการคิดจะละ `reasoning_effort` ไว้ เพราะโมเดลเหล่านั้นไม่รองรับค่าที่ปิดใช้งาน
- DeepSeek R1 Distill, Qwen QwQ และ Compound ใช้พื้นผิว reasoning ดั้งเดิมของ Groq; `/think` ควบคุมการมองเห็น แต่โมเดลจะให้เหตุผลเสมอ

ดู [โหมดการคิด](/th/tools/thinking) สำหรับระดับ `/think` ที่ใช้ร่วมกัน และวิธีที่ OpenClaw แปลค่าเหล่านั้นในแต่ละผู้ให้บริการ

## การถอดเสียงเสียง

Plugin ของ Groq ที่รวมมาให้ยังลงทะเบียน **ผู้ให้บริการทำความเข้าใจสื่อเสียง** เพื่อให้ข้อความเสียงสามารถถอดเสียงผ่านพื้นผิว `tools.media.audio` ที่ใช้ร่วมกันได้

| คุณสมบัติ           | ค่า                                     |
| ------------------ | ----------------------------------------- |
| พาธการกำหนดค่าที่ใช้ร่วมกัน | `tools.media.audio`                       |
| URL ฐานเริ่มต้น   | `https://api.groq.com/openai/v1`          |
| โมเดลเริ่มต้น      | `whisper-large-v3-turbo`                  |
| ลำดับความสำคัญอัตโนมัติ      | 20                                        |
| endpoint ของ API       | เข้ากันได้กับ OpenAI `/audio/transcriptions` |

หากต้องการให้ Groq เป็นแบ็กเอนด์เสียงเริ่มต้น:

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
  <Accordion title="ความพร้อมใช้งานของสภาพแวดล้อมสำหรับ daemon">
    หาก Gateway ทำงานเป็นบริการที่จัดการไว้ (launchd, systemd, Docker) `GROQ_API_KEY` ต้องมองเห็นได้สำหรับโปรเซสนั้น ไม่ใช่แค่เชลล์แบบโต้ตอบของคุณเท่านั้น

    <Warning>
      คีย์ที่อยู่เฉพาะใน `~/.profile` จะไม่ช่วย daemon ของ launchd หรือ systemd เว้นแต่ว่าสภาพแวดล้อมนั้นจะถูกนำเข้าไปที่นั่นด้วย ตั้งค่าคีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้โปรเซส gateway อ่านได้
    </Warning>

  </Accordion>

  <Accordion title="รหัสโมเดล Groq แบบกำหนดเอง">
    OpenClaw ยอมรับรหัสโมเดล Groq ใดก็ได้ในขณะรันไทม์ ใช้รหัสที่ Groq แสดงไว้อย่างตรงตัว และเติมคำนำหน้าด้วย `groq/` แค็ตตาล็อกที่รวมมาให้ครอบคลุมกรณีทั่วไป ส่วนรหัสที่ไม่มีในแค็ตตาล็อกจะใช้เทมเพลตเริ่มต้นที่เข้ากันได้กับ OpenAI

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
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="โหมดการคิด" href="/th/tools/thinking" icon="brain">
    ระดับความพยายามในการให้เหตุผลและปฏิสัมพันธ์กับนโยบายของผู้ให้บริการ
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าแบบเต็ม รวมถึงการตั้งค่าผู้ให้บริการและเสียง
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Groq, เอกสาร API และราคา
  </Card>
</CardGroup>
