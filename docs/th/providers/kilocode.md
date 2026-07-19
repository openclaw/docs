---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน Kilo Gateway ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ Kilo Gateway เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-19T07:32:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0246a1a77f4265168b213e0167360e1cd89dc2ca864997f08cae5331037f9e89
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากผ่านเอ็นด์พอยต์ที่เข้ากันได้กับ OpenAI และคีย์ API เดียว

| คุณสมบัติ | ค่า                              |
| -------- | ---------------------------------- |
| ผู้ให้บริการ | `kilocode`                         |
| การยืนยันตัวตน     | `KILOCODE_API_KEY`                 |
| API      | เข้ากันได้กับ OpenAI                  |
| URL ฐาน | `https://api.kilo.ai/api/gateway/` |

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## การตั้งค่า

<Steps>
  <Step title="สร้างบัญชี">
    ไปที่ [app.kilo.ai](https://app.kilo.ai) ลงชื่อเข้าใช้หรือสร้างบัญชี จากนั้นสร้างคีย์ API
  </Step>
  <Step title="ดำเนินการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    หรือตั้งค่าตัวแปรสภาพแวดล้อมโดยตรง:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## โมเดลเริ่มต้นและแค็ตตาล็อก

โมเดลเริ่มต้นคือ `kilocode/kilo-auto/balanced` ซึ่งเป็นระดับการกำหนดเส้นทางอัจฉริยะแบบสมดุลของ Kilo Gateway
OpenClaw ไม่เผยแพร่การจับคู่งานกับโมเดลต้นทางสำหรับโมเดลนี้ โดย Kilo Gateway
เป็นผู้ควบคุมการกำหนดเส้นทางเบื้องหลัง `kilo-auto/balanced`

เมื่อเริ่มทำงาน OpenClaw จะสอบถาม `GET https://api.kilo.ai/api/gateway/models` และรวมโมเดลที่ค้นพบ
ไว้ก่อนแค็ตตาล็อกสำรองแบบคงที่ แค็ตตาล็อกสำรองแบบคงที่มีเฉพาะ
`kilocode/kilo-auto/balanced` (`Auto Balanced`, `input: ["text", "image"]`, `reasoning: true`,
`contextWindow: 1000000`, `maxTokens: 65536`)

โมเดลใดก็ตามบน Gateway สามารถอ้างอิงได้ในรูปแบบ `kilocode/<upstream-id>` (ตัวอย่างเช่น
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`) เรียกใช้ `/models kilocode` หรือ
`openclaw models list --provider kilocode` เพื่อดูรายการทั้งหมดที่ค้นพบ

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo-auto/balanced" },
    },
  },
}
```

## หมายเหตุเกี่ยวกับลักษณะการทำงาน

<AccordionGroup>
  <Accordion title="การรับส่งข้อมูลและความเข้ากันได้">
    Kilo Gateway เข้ากันได้กับ OpenRouter จึงใช้เส้นทางคำขอที่เข้ากันได้กับ OpenAI ในรูปแบบพร็อกซี
    แทนการจัดรูปแบบคำขอแบบเนทีฟของ OpenAI (ไม่มี `store` และไม่มีเพย์โหลดระดับความพยายามในการใช้เหตุผลของ OpenAI)

    - การอ้างอิง Kilo ที่รองรับโดย Gemini จะยังคงอยู่บนเส้นทางพร็อกซี Gemini: OpenClaw จะปรับลายเซ็น
      ความคิดของ Gemini ให้ปลอดภัยในเส้นทางนั้น แต่จะไม่เปิดใช้การตรวจสอบความถูกต้องของการเล่นซ้ำหรือการเขียน bootstrap ใหม่แบบเนทีฟของ Gemini
    - คำขอใช้โทเค็น Bearer ที่สร้างจากคีย์ API ของคุณ

  </Accordion>

  <Accordion title="ตัวครอบสตรีมและการใช้เหตุผล">
    ตัวครอบสตรีมของ Kilo เพิ่มส่วนหัวคำขอ `X-KILOCODE-FEATURE` (ค่าเริ่มต้นคือ `openclaw`
    และเขียนทับได้ด้วยตัวแปรสภาพแวดล้อม `KILOCODE_FEATURE`) พร้อมทั้งปรับเพย์โหลดระดับความพยายามในการใช้เหตุผลให้เป็นมาตรฐานสำหรับ
    โมเดลที่รองรับ

    <Warning>
    การอ้างอิง `kilocode/kilo-auto/balanced` และ `x-ai/*` จะข้ามการแทรกระดับความพยายามในการใช้เหตุผล ใช้การอ้างอิง
    โมเดลที่เจาะจง เช่น `kilocode/anthropic/claude-sonnet-4` หากต้องการการรองรับการใช้เหตุผล
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากการค้นหาโมเดลล้มเหลวเมื่อเริ่มทำงาน OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกแบบคงที่ซึ่งมี `kilocode/kilo-auto/balanced`
    - ตรวจสอบว่าคีย์ API ของคุณถูกต้องและบัญชี Kilo ของคุณเปิดใช้โมเดลที่ต้องการแล้ว
    - เมื่อ Gateway ทำงานเป็นดีมอน โปรดตรวจสอบว่าโปรเซสนั้นสามารถเข้าถึง `KILOCODE_API_KEY` ได้ (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw ฉบับสมบูรณ์
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Kilo Gateway คีย์ API และการจัดการบัญชี
  </Card>
</CardGroup>
