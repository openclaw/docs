---
read_when:
    - คุณต้องการใช้ Groq กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า Groq (การยืนยันตัวตน + การเลือกโมเดล)
title: Groq
x-i18n:
    generated_at: "2026-05-02T10:26:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) ให้การอนุมานความเร็วสูงมากบนโมเดลโอเพนซอร์ส
(Llama, Gemma, Mistral และอื่น ๆ) โดยใช้ฮาร์ดแวร์ LPU แบบกำหนดเอง OpenClaw เชื่อมต่อ
กับ Groq ผ่าน API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า               |
| -------- | ----------------- |
| ผู้ให้บริการ | `groq`            |
| การตรวจสอบสิทธิ์ | `GROQ_API_KEY`    |
| API      | เข้ากันได้กับ OpenAI |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key">
    สร้าง API key ที่ [console.groq.com/keys](https://console.groq.com/keys)
  </Step>
  <Step title="ตั้งค่า API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

## แค็ตตาล็อกในตัว

OpenClaw มาพร้อมแค็ตตาล็อก Groq ที่มี manifest รองรับสำหรับการแสดงรายการโมเดล
แบบกรองตามผู้ให้บริการได้รวดเร็ว เรียกใช้ `openclaw models list --all --provider groq` เพื่อดูแถว
ที่รวมมาให้ หรือดูที่
[console.groq.com/docs/models](https://console.groq.com/docs/models)

| โมเดล                       | หมายเหตุ                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | ใช้งานทั่วไป, context ขนาดใหญ่     |
| **Llama 3.1 8B Instant**    | รวดเร็ว, น้ำหนักเบา                  |
| **Gemma 2 9B**              | กะทัดรัด, มีประสิทธิภาพ                 |
| **Mixtral 8x7B**            | สถาปัตยกรรม MoE, การให้เหตุผลแข็งแกร่ง |

<Tip>
ใช้ `openclaw models list --all --provider groq` สำหรับแถว Groq ที่มี manifest รองรับ
ซึ่ง OpenClaw เวอร์ชันนี้รู้จัก
</Tip>

## โมเดลการให้เหตุผล

OpenClaw จับคู่ระดับ `/think` ที่ใช้ร่วมกันกับค่า `reasoning_effort`
เฉพาะโมเดลของ Groq สำหรับ `qwen/qwen3-32b` เมื่อปิดการคิดจะส่ง
`none` และเมื่อเปิดการคิดจะส่ง `default` สำหรับโมเดลการให้เหตุผล Groq GPT-OSS
OpenClaw จะส่ง `low`, `medium` หรือ `high`; เมื่อปิดการคิดจะไม่ใส่
`reasoning_effort` เพราะโมเดลเหล่านั้นไม่รองรับค่าปิดใช้งาน

## การถอดเสียงเสียง

Groq ยังให้บริการถอดเสียงเสียงแบบ Whisper ที่รวดเร็วด้วย เมื่อกำหนดค่าเป็น
ผู้ให้บริการการทำความเข้าใจสื่อ OpenClaw จะใช้โมเดล `whisper-large-v3-turbo`
ของ Groq เพื่อถอดเสียงข้อความเสียงผ่านพื้นผิว `tools.media.audio` ที่ใช้ร่วมกัน

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
  <Accordion title="รายละเอียดการถอดเสียงเสียง">
    | คุณสมบัติ | ค่า |
    |----------|-------|
    | เส้นทาง config ที่ใช้ร่วมกัน | `tools.media.audio` |
    | URL ฐานเริ่มต้น   | `https://api.groq.com/openai/v1` |
    | โมเดลเริ่มต้น      | `whisper-large-v3-turbo` |
    | endpoint ของ API       | `/audio/transcriptions` ที่เข้ากันได้กับ OpenAI |
  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `GROQ_API_KEY`
    พร้อมใช้งานสำหรับ process นั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)

    <Warning>
    Keys ที่ตั้งไว้เฉพาะใน interactive shell ของคุณจะไม่ปรากฏต่อ process ของ gateway
    ที่จัดการโดย daemon ใช้ config `~/.openclaw/.env` หรือ `env.shellEnv` เพื่อให้
    พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema config ฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการและเสียง
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Groq, เอกสาร API และราคา
  </Card>
  <Card title="รายการโมเดล Groq" href="https://console.groq.com/docs/models" icon="list">
    แค็ตตาล็อกโมเดล Groq อย่างเป็นทางการ
  </Card>
</CardGroup>
