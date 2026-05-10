---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน Kilo Gateway ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ Kilo Gateway เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-10T19:54:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway ให้บริการ **API แบบรวมศูนย์** ที่ส่งต่อคำขอไปยังโมเดลจำนวนมากเบื้องหลัง endpoint และ API key เดียว รองรับการทำงานแบบเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้ด้วยการเปลี่ยน base URL

| คุณสมบัติ | ค่า                                |
| -------- | ---------------------------------- |
| ผู้ให้บริการ | `kilocode`                         |
| การยืนยันตัวตน | `KILOCODE_API_KEY`                 |
| API      | เข้ากันได้กับ OpenAI                  |
| URL ฐาน | `https://api.kilo.ai/api/gateway/` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างบัญชี">
    ไปที่ [app.kilo.ai](https://app.kilo.ai) ลงชื่อเข้าใช้หรือสร้างบัญชี จากนั้นไปที่ API Keys แล้วสร้างคีย์ใหม่
  </Step>
  <Step title="เรียกใช้ onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    หรือกำหนดตัวแปรสภาพแวดล้อมโดยตรง:

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

## โมเดลเริ่มต้น

โมเดลเริ่มต้นคือ `kilocode/kilo/auto` ซึ่งเป็นโมเดล smart-routing
ที่ผู้ให้บริการเป็นเจ้าของและจัดการโดย Kilo Gateway

<Note>
OpenClaw ถือว่า `kilocode/kilo/auto` เป็น ref เริ่มต้นที่เสถียร แต่ไม่ได้
เผยแพร่การแมปงานไปยังโมเดลต้นทางที่มีแหล่งข้อมูลรองรับสำหรับ route นั้น การกำหนด
route ต้นทางที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้
hard-code อยู่ใน OpenClaw
</Note>

## แค็ตตาล็อกในตัว

OpenClaw ค้นหาโมเดลที่พร้อมใช้งานจาก Kilo Gateway แบบไดนามิกเมื่อเริ่มต้นระบบ ใช้
`/models kilocode` เพื่อดูรายการโมเดลทั้งหมดที่บัญชีของคุณใช้ได้

โมเดลใดก็ตามที่พร้อมใช้งานบน gateway สามารถใช้กับ prefix `kilocode/` ได้:

| Ref ของโมเดล                              | หมายเหตุ                           |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | เริ่มต้น — smart routing           |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic ผ่าน Kilo                |
| `kilocode/openai/gpt-5.5`                | OpenAI ผ่าน Kilo                   |
| `kilocode/google/gemini-3.1-pro-preview` | Google ผ่าน Kilo                   |
| ...และอื่น ๆ อีกมากมาย                    | ใช้ `/models kilocode` เพื่อแสดงทั้งหมด |

<Tip>
เมื่อเริ่มต้นระบบ OpenClaw จะเรียก `GET https://api.kilo.ai/api/gateway/models` และรวม
โมเดลที่ค้นพบไว้ก่อนหน้าแค็ตตาล็อก fallback แบบคงที่ fallback ที่รวมมาในแพ็กเกจจะ
มี `kilocode/kilo/auto` (`Kilo Auto`) พร้อม `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` และ `maxTokens: 128000` เสมอ
</Tip>

## ตัวอย่างการตั้งค่า

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
  <Accordion title="การรับส่งข้อมูลและความเข้ากันได้">
    Kilo Gateway มีเอกสารในซอร์สว่าเข้ากันได้กับ OpenRouter ดังนั้นจึงยังอยู่บน
    เส้นทางที่เข้ากันได้กับ OpenAI แบบ proxy-style แทนการจัดรูปแบบคำขอ OpenAI แบบ native

    - Kilo refs ที่รองรับด้วย Gemini จะยังอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw จึงคง
      การทำความสะอาด thought-signature ของ Gemini ไว้ที่นั่น โดยไม่เปิดใช้การตรวจสอบ replay ของ Gemini แบบ native
      หรือ bootstrap rewrites
    - Kilo Gateway ใช้ Bearer token กับ API key ของคุณเบื้องหลัง

  </Accordion>

  <Accordion title="Stream wrapper และ reasoning">
    stream wrapper ที่ใช้ร่วมกันของ Kilo จะเพิ่ม provider app header และปรับ
    proxy reasoning payloads ให้เป็นมาตรฐานสำหรับ ref ของโมเดลจริงที่รองรับ

    <Warning>
    `kilocode/kilo/auto` และ hint อื่น ๆ ที่ไม่รองรับ proxy-reasoning จะข้ามการ
    injection reasoning หากคุณต้องการรองรับ reasoning ให้ใช้ ref ของโมเดลจริง เช่น
    `kilocode/anthropic/claude-sonnet-4`
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากการค้นหาโมเดลล้มเหลวเมื่อเริ่มต้นระบบ OpenClaw จะ fallback ไปยังแค็ตตาล็อกแบบคงที่ที่รวมมาในแพ็กเกจ ซึ่งมี `kilocode/kilo/auto`
    - ยืนยันว่า API key ของคุณถูกต้อง และบัญชี Kilo ของคุณเปิดใช้โมเดลที่ต้องการแล้ว
    - เมื่อ Gateway ทำงานเป็น daemon ตรวจสอบให้แน่ใจว่า `KILOCODE_API_KEY` พร้อมใช้งานสำหรับ process นั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, ref ของโมเดล และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการตั้งค่า OpenClaw ฉบับเต็ม
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Kilo Gateway, API keys และการจัดการบัญชี
  </Card>
</CardGroup>
