---
read_when:
    - คุณต้องการคีย์เอพีไอเพียงคีย์เดียวสำหรับโมเดลภาษาขนาดใหญ่หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน Kilo Gateway ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ Kilo Gateway เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-30T10:11:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway ให้ **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากเบื้องหลัง
endpoint และคีย์ API เดียว โดยเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้ด้วยการเปลี่ยน URL ฐาน

| คุณสมบัติ | ค่า                                |
| -------- | ---------------------------------- |
| ผู้ให้บริการ | `kilocode`                         |
| การยืนยันตัวตน | `KILOCODE_API_KEY`                 |
| API      | เข้ากันได้กับ OpenAI                  |
| URL ฐาน | `https://api.kilo.ai/api/gateway/` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างบัญชี">
    ไปที่ [app.kilo.ai](https://app.kilo.ai) ลงชื่อเข้าใช้หรือสร้างบัญชี จากนั้นไปที่คีย์ API แล้วสร้างคีย์ใหม่
  </Step>
  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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

## โมเดลค่าเริ่มต้น

โมเดลค่าเริ่มต้นคือ `kilocode/kilo/auto` ซึ่งเป็นโมเดลการกำหนดเส้นทางอัจฉริยะ
ที่ผู้ให้บริการเป็นเจ้าของและจัดการโดย Kilo Gateway

<Note>
OpenClaw ถือว่า `kilocode/kilo/auto` เป็น ref ค่าเริ่มต้นที่เสถียร แต่ไม่ได้
เผยแพร่การแมปจากงานไปยังโมเดลต้นทางที่มีแหล่งข้อมูลรองรับสำหรับเส้นทางนั้น การกำหนดเส้นทาง
ต้นทางที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้
ฝังตายตัวใน OpenClaw
</Note>

## แคตตาล็อกในตัว

OpenClaw ค้นหาโมเดลที่พร้อมใช้งานจาก Kilo Gateway แบบไดนามิกเมื่อเริ่มทำงาน ใช้
`/models kilocode` เพื่อดูรายชื่อโมเดลทั้งหมดที่บัญชีของคุณใช้งานได้

โมเดลใดๆ ที่พร้อมใช้งานบน Gateway สามารถใช้กับคำนำหน้า `kilocode/` ได้:

| ref ของโมเดล                           | หมายเหตุ                           |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | ค่าเริ่มต้น — การกำหนดเส้นทางอัจฉริยะ |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic ผ่าน Kilo                |
| `kilocode/openai/gpt-5.5`              | OpenAI ผ่าน Kilo                   |
| `kilocode/google/gemini-3-pro-preview` | Google ผ่าน Kilo                   |
| ...และอีกมากมาย                        | ใช้ `/models kilocode` เพื่อแสดงทั้งหมด |

<Tip>
เมื่อเริ่มทำงาน OpenClaw จะเรียก `GET https://api.kilo.ai/api/gateway/models` และผสาน
โมเดลที่ค้นพบไว้ก่อนแคตตาล็อกสำรองแบบคงที่ แคตตาล็อกสำรองที่รวมมาให้จะมี
`kilocode/kilo/auto` (`Kilo Auto`) เสมอ พร้อม `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` และ `maxTokens: 128000`
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
  <Accordion title="การขนส่งและความเข้ากันได้">
    Kilo Gateway มีเอกสารในซอร์สว่าเข้ากันได้กับ OpenRouter ดังนั้นจึงอยู่บน
    เส้นทางแบบพร็อกซีที่เข้ากันได้กับ OpenAI แทนการจัดรูปคำขอ OpenAI แบบเนทีฟ

    - Kilo refs ที่รองรับด้วย Gemini จะยังอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw จึงคง
      การทำความสะอาดลายเซ็นความคิดของ Gemini ไว้ที่นั่น โดยไม่เปิดใช้การตรวจสอบ replay ของ Gemini
      แบบเนทีฟหรือการเขียน bootstrap ใหม่
    - Kilo Gateway ใช้โทเค็น Bearer ร่วมกับคีย์ API ของคุณเบื้องหลัง

  </Accordion>

  <Accordion title="ตัวห่อหุ้มสตรีมและการให้เหตุผล">
    ตัวห่อหุ้มสตรีมที่ใช้ร่วมกันของ Kilo จะเพิ่มส่วนหัวแอปของผู้ให้บริการและทำให้
    payload การให้เหตุผลของพร็อกซีเป็นมาตรฐานสำหรับ ref ของโมเดลที่ระบุซึ่งรองรับ

    <Warning>
    `kilocode/kilo/auto` และ hint อื่นๆ ที่ไม่รองรับ proxy-reasoning จะข้ามการฉีดข้อมูลการให้เหตุผล
    หากคุณต้องการการรองรับการให้เหตุผล ให้ใช้ ref ของโมเดลที่ระบุ เช่น
    `kilocode/anthropic/claude-sonnet-4`
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากการค้นหาโมเดลล้มเหลวเมื่อเริ่มทำงาน OpenClaw จะย้อนกลับไปใช้แคตตาล็อกคงที่ที่รวมมาให้ ซึ่งมี `kilocode/kilo/auto`
    - ยืนยันว่าคีย์ API ของคุณถูกต้อง และบัญชี Kilo ของคุณเปิดใช้โมเดลที่ต้องการแล้ว
    - เมื่อ Gateway ทำงานเป็น daemon ให้ตรวจสอบว่า `KILOCODE_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ ref ของโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรองเมื่อเกิดข้อผิดพลาด
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw ฉบับสมบูรณ์
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Kilo Gateway คีย์ API และการจัดการบัญชี
  </Card>
</CardGroup>
