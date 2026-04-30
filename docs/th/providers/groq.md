---
read_when:
    - คุณต้องการใช้ Groq กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า Groq (การยืนยันตัวตน + การเลือกโมเดล)
title: Groq
x-i18n:
    generated_at: "2026-04-30T10:11:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) ให้การอนุมานที่รวดเร็วเป็นพิเศษบนโมเดลโอเพนซอร์ส
(Llama, Gemma, Mistral และอื่นๆ) โดยใช้ฮาร์ดแวร์ LPU แบบกำหนดเอง OpenClaw เชื่อมต่อ
กับ Groq ผ่าน API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า              |
| -------- | ----------------- |
| ผู้ให้บริการ | `groq`            |
| การยืนยันตัวตน | `GROQ_API_KEY`    |
| API      | เข้ากันได้กับ OpenAI |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ที่ [console.groq.com/keys](https://console.groq.com/keys)
  </Step>
  <Step title="ตั้งค่าคีย์ API">
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

แค็ตตาล็อกโมเดลของ Groq เปลี่ยนแปลงบ่อย เรียกใช้ `openclaw models list | grep groq`
เพื่อดูโมเดลที่พร้อมใช้งานในปัจจุบัน หรือตรวจสอบที่
[console.groq.com/docs/models](https://console.groq.com/docs/models)

| โมเดล                       | หมายเหตุ                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | ใช้งานทั่วไป บริบทขนาดใหญ่     |
| **Llama 3.1 8B Instant**    | รวดเร็ว น้ำหนักเบา                  |
| **Gemma 2 9B**              | กะทัดรัด มีประสิทธิภาพ                 |
| **Mixtral 8x7B**            | สถาปัตยกรรม MoE การให้เหตุผลที่แข็งแกร่ง |

<Tip>
ใช้ `openclaw models list --provider groq` เพื่อดูรายการล่าสุดของ
โมเดลที่พร้อมใช้งานในบัญชีของคุณ
</Tip>

## โมเดลการให้เหตุผล

OpenClaw จับคู่ระดับ `/think` ที่ใช้ร่วมกันกับค่า `reasoning_effort`
เฉพาะโมเดลของ Groq สำหรับ `qwen/qwen3-32b` การปิดการคิดจะส่ง
`none` และการเปิดการคิดจะส่ง `default` สำหรับโมเดลการให้เหตุผล Groq GPT-OSS
OpenClaw จะส่ง `low`, `medium` หรือ `high`; การปิดการคิดจะละเว้น
`reasoning_effort` เพราะโมเดลเหล่านั้นไม่รองรับค่าที่ปิดใช้งาน

## การถอดเสียงเสียง

Groq ยังให้บริการถอดเสียงเสียงแบบรวดเร็วที่ใช้ Whisper เมื่อกำหนดค่าเป็น
ผู้ให้บริการทำความเข้าใจสื่อ OpenClaw จะใช้โมเดล `whisper-large-v3-turbo`
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
    | พาธกำหนดค่าที่ใช้ร่วมกัน | `tools.media.audio` |
    | URL ฐานเริ่มต้น   | `https://api.groq.com/openai/v1` |
    | โมเดลเริ่มต้น      | `whisper-large-v3-turbo` |
    | ปลายทาง API       | `/audio/transcriptions` ที่เข้ากันได้กับ OpenAI |
  </Accordion>

  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `GROQ_API_KEY`
    พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะในเชลล์แบบโต้ตอบของคุณจะไม่ปรากฏต่อโปรเซส gateway
    ที่จัดการโดย daemon ใช้การกำหนดค่า `~/.openclaw/.env` หรือ `env.shellEnv`
    เพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมากำหนดค่าแบบเต็ม รวมถึงการตั้งค่าผู้ให้บริการและเสียง
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Groq, เอกสาร API และราคา
  </Card>
  <Card title="รายการโมเดล Groq" href="https://console.groq.com/docs/models" icon="list">
    แค็ตตาล็อกโมเดล Groq อย่างเป็นทางการ
  </Card>
</CardGroup>
