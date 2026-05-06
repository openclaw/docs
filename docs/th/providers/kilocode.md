---
read_when:
    - คุณต้องการคีย์ API เพียงคีย์เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน Kilo Gateway ใน OpenClaw
summary: ใช้ API แบบรวมของ Kilo Gateway เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T18:00:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway มี **API แบบรวมศูนย์** ที่ส่งต่อคำขอไปยังโมเดลจำนวนมากเบื้องหลัง
endpoint และคีย์ API เดียว โดยเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้ด้วยการเปลี่ยน base URL

| คุณสมบัติ | ค่า                              |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | เข้ากันได้กับ OpenAI                  |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Create an account">
    ไปที่ [app.kilo.ai](https://app.kilo.ai) ลงชื่อเข้าใช้หรือสร้างบัญชี จากนั้นไปที่ API Keys แล้วสร้างคีย์ใหม่
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    หรือกำหนดตัวแปรสภาพแวดล้อมโดยตรง:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## โมเดลเริ่มต้น

โมเดลเริ่มต้นคือ `kilocode/kilo/auto` ซึ่งเป็นโมเดลกำหนดเส้นทางอัจฉริยะที่ผู้ให้บริการเป็นเจ้าของ
และจัดการโดย Kilo Gateway

<Note>
OpenClaw ถือว่า `kilocode/kilo/auto` เป็น ref เริ่มต้นที่เสถียร แต่ไม่ได้
เผยแพร่การแมประหว่างงานกับโมเดลต้นทางที่อ้างอิงแหล่งข้อมูลสำหรับเส้นทางนี้ การกำหนดเส้นทาง
ต้นทางที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้
ถูก hard-code ไว้ใน OpenClaw
</Note>

## แคตตาล็อกในตัว

OpenClaw ค้นหาโมเดลที่มีอยู่จาก Kilo Gateway แบบไดนามิกเมื่อเริ่มต้น ใช้
`/models kilocode` เพื่อดูรายการโมเดลทั้งหมดที่บัญชีของคุณใช้งานได้

โมเดลใดก็ตามที่มีบน Gateway สามารถใช้กับคำนำหน้า `kilocode/` ได้:

| Model ref                              | หมายเหตุ                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | ค่าเริ่มต้น — การกำหนดเส้นทางอัจฉริยะ            |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic ผ่าน Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI ผ่าน Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google ผ่าน Kilo                    |
| ...และอีกมากมาย                       | ใช้ `/models kilocode` เพื่อแสดงทั้งหมด |

<Tip>
เมื่อเริ่มต้น OpenClaw จะเรียก `GET https://api.kilo.ai/api/gateway/models` และผสาน
โมเดลที่ค้นพบไว้ก่อนแคตตาล็อก fallback แบบคงที่ fallback ที่มาพร้อมกันจะ
รวม `kilocode/kilo/auto` (`Kilo Auto`) ที่มี `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` และ `maxTokens: 128000` เสมอ
</Tip>

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway ถูกบันทึกไว้ในซอร์สว่าเข้ากันได้กับ OpenRouter จึงยังอยู่บน
    เส้นทางแบบ proxy ที่เข้ากันได้กับ OpenAI แทนที่จะจัดรูปคำขอแบบ OpenAI native

    - Kilo refs ที่รองรับด้วย Gemini ยังคงอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw จึงเก็บ
      การทำความสะอาด Gemini thought-signature ไว้ตรงนั้นโดยไม่เปิดใช้งาน
      การตรวจสอบ replay หรือการเขียน bootstrap ใหม่แบบ Gemini native
    - Kilo Gateway ใช้ Bearer token ร่วมกับคีย์ API ของคุณภายใน

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    stream wrapper ที่ใช้ร่วมกันของ Kilo จะเพิ่มส่วนหัวแอปของผู้ให้บริการและปรับ
    payload reasoning ของ proxy ให้เป็นรูปแบบเดียวกันสำหรับ concrete model refs ที่รองรับ

    <Warning>
    `kilocode/kilo/auto` และ hint อื่นที่ไม่รองรับ proxy-reasoning จะข้ามการฉีด reasoning
    หากคุณต้องการการรองรับ reasoning ให้ใช้ concrete model ref เช่น
    `kilocode/anthropic/claude-sonnet-4`
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - หากการค้นหาโมเดลล้มเหลวเมื่อเริ่มต้น OpenClaw จะ fallback ไปยังแคตตาล็อกแบบคงที่ที่มาพร้อมกันซึ่งมี `kilocode/kilo/auto`
    - ยืนยันว่าคีย์ API ของคุณถูกต้อง และบัญชี Kilo ของคุณเปิดใช้งานโมเดลที่ต้องการแล้ว
    - เมื่อ Gateway ทำงานเป็น daemon ตรวจสอบให้แน่ใจว่า `KILOCODE_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่นใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model refs และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw ฉบับเต็ม
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Kilo Gateway, คีย์ API และการจัดการบัญชี
  </Card>
</CardGroup>
