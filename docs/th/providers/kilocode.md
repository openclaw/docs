---
read_when:
    - คุณต้องการคีย์ API เพียงคีย์เดียวสำหรับ LLM หลายโมเดล
    - คุณต้องการเรียกใช้โมเดลผ่าน Kilo Gateway ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ Kilo Gateway เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-12T16:37:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากผ่านปลายทางที่เข้ากันได้กับ OpenAI และคีย์ API เพียงชุดเดียว

| คุณสมบัติ | ค่า                                |
| -------- | ---------------------------------- |
| ผู้ให้บริการ | `kilocode`                         |
| การยืนยันตัวตน | `KILOCODE_API_KEY`                 |
| API      | เข้ากันได้กับ OpenAI                  |
| URL ฐาน | `https://api.kilo.ai/api/gateway/` |

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## ตั้งค่า

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

โมเดลเริ่มต้นคือ `kilocode/kilo/auto` ซึ่งเป็นโมเดลกำหนดเส้นทางอัจฉริยะที่ผู้ให้บริการเป็นผู้ดูแล OpenClaw ไม่ได้
เผยแพร่การจับคู่งานกับโมเดลต้นทางสำหรับโมเดลนี้ การกำหนดเส้นทางเบื้องหลัง `kilo/auto` อยู่ภายใต้การดูแลของ Kilo Gateway

เมื่อเริ่มต้น OpenClaw จะส่งคำขอไปยัง `GET https://api.kilo.ai/api/gateway/models` และผสานโมเดลที่ค้นพบ
ไว้ก่อนแค็ตตาล็อกสำรองแบบคงที่ แค็ตตาล็อกสำรองแบบคงที่มีเฉพาะ `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`)

โมเดลใดก็ตามบน Gateway สามารถอ้างอิงได้ในรูปแบบ `kilocode/<upstream-id>` (ตัวอย่างเช่น
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`) เรียกใช้ `/models kilocode` หรือ
`openclaw models list --provider kilocode` เพื่อดูรายการทั้งหมดที่ค้นพบ

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

## หมายเหตุเกี่ยวกับการทำงาน

<AccordionGroup>
  <Accordion title="การรับส่งข้อมูลและความเข้ากันได้">
    Kilo Gateway เข้ากันได้กับ OpenRouter จึงใช้เส้นทางคำขอที่เข้ากันได้กับ OpenAI แบบพร็อกซี
    แทนการจัดรูปแบบคำขอแบบเนทีฟของ OpenAI (ไม่มี `store` และไม่มีเพย์โหลดระดับความพยายามในการให้เหตุผลของ OpenAI)

    - การอ้างอิง Kilo ที่ใช้ Gemini เป็นระบบเบื้องหลังจะยังคงใช้เส้นทางพร็อกซี Gemini: OpenClaw จะปรับลายเซ็น
      ความคิดของ Gemini ให้ปลอดภัยในเส้นทางนี้ แต่จะไม่เปิดใช้การตรวจสอบความถูกต้องของการเล่นซ้ำหรือการเขียนบูตสแตรปใหม่แบบเนทีฟของ Gemini
    - คำขอใช้โทเค็น Bearer ที่สร้างจากคีย์ API ของคุณ

  </Accordion>

  <Accordion title="ตัวห่อหุ้มสตรีมและการให้เหตุผล">
    ตัวห่อหุ้มสตรีมของ Kilo จะเพิ่มส่วนหัวคำขอ `X-KILOCODE-FEATURE` (ค่าเริ่มต้นคือ `openclaw`
    และเขียนทับได้ด้วยตัวแปรสภาพแวดล้อม `KILOCODE_FEATURE`) พร้อมทั้งปรับเพย์โหลดระดับความพยายามในการให้เหตุผล
    ให้เป็นรูปแบบมาตรฐานสำหรับโมเดลที่รองรับ

    <Warning>
    การอ้างอิง `kilocode/kilo/auto` และ `x-ai/*` จะข้ามการแทรกระดับความพยายามในการให้เหตุผล หากต้องการรองรับ
    การให้เหตุผล ให้ใช้การอ้างอิงโมเดลที่เฉพาะเจาะจง เช่น `kilocode/anthropic/claude-sonnet-4`
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากการค้นหาโมเดลล้มเหลวระหว่างการเริ่มต้น OpenClaw จะใช้แค็ตตาล็อกสำรองแบบคงที่ซึ่งมี `kilocode/kilo/auto`
    - ยืนยันว่าคีย์ API ของคุณถูกต้อง และบัญชี Kilo ของคุณเปิดใช้งานโมเดลที่ต้องการแล้ว
    - เมื่อ Gateway ทำงานเป็นดีมอน ตรวจสอบว่าโปรเซสนั้นเข้าถึง `KILOCODE_API_KEY` ได้ (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

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
