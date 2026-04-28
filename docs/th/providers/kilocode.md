---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการรัน model ผ่าน Kilo Gateway ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ Kilo Gateway เพื่อเข้าถึง model จำนวนมากใน OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T09:28:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway ให้บริการ **API แบบรวมศูนย์** ที่ส่งต่อคำขอไปยัง model จำนวนมากผ่าน endpoint และ API key เดียว โดยเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้เพียงเปลี่ยน base URL

| คุณสมบัติ | ค่า                               |
| -------- | --------------------------------- |
| Provider | `kilocode`                        |
| Auth     | `KILOCODE_API_KEY`                |
| API      | เข้ากันได้กับ OpenAI              |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างบัญชี">
    ไปที่ [app.kilo.ai](https://app.kilo.ai) ลงชื่อเข้าใช้หรือสร้างบัญชี จากนั้นไปที่ API Keys และสร้างคีย์ใหม่
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    หรือกำหนดตัวแปรสภาพแวดล้อมโดยตรง:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="ตรวจสอบว่า model พร้อมใช้งาน">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## model เริ่มต้น

model เริ่มต้นคือ `kilocode/kilo/auto` ซึ่งเป็น model แบบ smart-routing ที่เป็นของ provider และถูกจัดการโดย Kilo Gateway

<Note>
OpenClaw ปฏิบัติต่อ `kilocode/kilo/auto` เป็น ref เริ่มต้นที่เสถียร แต่ไม่ได้เผยแพร่การแมประหว่างงานกับ model ต้นทางที่มีซอร์สรองรับสำหรับเส้นทางนี้ การกำหนดเส้นทางต้นทางจริงที่อยู่เบื้องหลัง `kilocode/kilo/auto` เป็นสิ่งที่ Kilo Gateway เป็นเจ้าของ ไม่ได้ถูกฮาร์ดโค้ดไว้ใน OpenClaw
</Note>

## แคตตาล็อกในตัว

OpenClaw จะค้นหา model ที่พร้อมใช้งานจาก Kilo Gateway แบบไดนามิกเมื่อเริ่มต้นระบบ ใช้ `/models kilocode` เพื่อดูรายการ model ทั้งหมดที่พร้อมใช้งานกับบัญชีของคุณ

model ใดก็ตามที่พร้อมใช้งานบน gateway สามารถใช้ได้ด้วย prefix `kilocode/`:

| Model ref                              | หมายเหตุ                          |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | ค่าเริ่มต้น — smart routing       |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic ผ่าน Kilo               |
| `kilocode/openai/gpt-5.5`              | OpenAI ผ่าน Kilo                  |
| `kilocode/google/gemini-3-pro-preview` | Google ผ่าน Kilo                  |
| ...and many more                       | ใช้ `/models kilocode` เพื่อแสดงทั้งหมด |

<Tip>
ตอนเริ่มต้นระบบ OpenClaw จะ query `GET https://api.kilo.ai/api/gateway/models` และรวม model ที่ค้นพบได้ไว้ก่อนแคตตาล็อก fallback แบบ static แคตตาล็อก fallback ที่มาพร้อมกันจะมี `kilocode/kilo/auto` (`Kilo Auto`) อยู่เสมอ พร้อม `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000` และ `maxTokens: 128000`
</Tip>

## ตัวอย่าง config

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
  <Accordion title="Transport และความเข้ากันได้">
    Kilo Gateway ถูกอธิบายไว้ในซอร์สว่าเข้ากันได้กับ OpenRouter ดังนั้นจึงยังคงอยู่บนเส้นทาง
    แบบ proxy-style ที่เข้ากันได้กับ OpenAI แทนการจัดรูปคำขอแบบ native ของ OpenAI

    - ref ของ Kilo ที่รองรับโดย Gemini จะยังคงอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw
      จะคงการทำ sanitation ของ Gemini thought-signature ไว้ โดยไม่เปิดใช้
      native Gemini replay validation หรือ bootstrap rewrites
    - Kilo Gateway ใช้ Bearer token พร้อม API key ของคุณอยู่เบื้องหลัง

  </Accordion>

  <Accordion title="ตัวครอบ stream และ reasoning">
    ตัวครอบ stream แบบใช้ร่วมกันของ Kilo จะเพิ่ม provider app header และ normalize
    payload reasoning ของ proxy สำหรับ ref ของ model แบบ concrete ที่รองรับ

    <Warning>
    `kilocode/kilo/auto` และ hint อื่น ๆ ที่ไม่รองรับ proxy-reasoning จะข้ามการ inject
    reasoning หากคุณต้องการรองรับ reasoning ให้ใช้ ref ของ model แบบ concrete เช่น
    `kilocode/anthropic/claude-sonnet-4`
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากการค้นหา model ล้มเหลวตอนเริ่มต้นระบบ OpenClaw จะ fallback ไปใช้แคตตาล็อก static ที่มาพร้อมกันซึ่งมี `kilocode/kilo/auto`
    - ตรวจสอบว่า API key ของคุณถูกต้อง และบัญชี Kilo ของคุณเปิดใช้งาน model ที่ต้องการแล้ว
    - เมื่อ Gateway รันเป็น daemon ให้แน่ใจว่า process นั้นเข้าถึง `KILOCODE_API_KEY` ได้ (เช่นใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือก model" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, ref ของ model และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่า OpenClaw แบบเต็ม
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Kilo Gateway, API key และการจัดการบัญชี
  </Card>
</CardGroup>
