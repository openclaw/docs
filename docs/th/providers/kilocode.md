---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการเรียกใช้โมเดลผ่าน Kilo Gateway ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ Kilo Gateway เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:14:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway มี **API แบบรวมศูนย์** ที่กำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากหลัง
endpoint และคีย์ API เดียว API นี้เข้ากันได้กับ OpenAI ดังนั้น SDK ของ OpenAI ส่วนใหญ่จึงใช้งานได้โดยเปลี่ยน URL ฐาน

| คุณสมบัติ | ค่า                                |
| -------- | ---------------------------------- |
| ผู้ให้บริการ | `kilocode`                         |
| การยืนยันตัวตน | `KILOCODE_API_KEY`                 |
| API      | เข้ากันได้กับ OpenAI              |
| URL ฐาน | `https://api.kilo.ai/api/gateway/` |

## ติดตั้ง Plugin

ติดตั้ง Plugin ทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างบัญชี">
    ไปที่ [app.kilo.ai](https://app.kilo.ai) ลงชื่อเข้าใช้หรือสร้างบัญชี จากนั้นไปที่ API Keys แล้วสร้างคีย์ใหม่
  </Step>
  <Step title="รันการเริ่มต้นใช้งาน">
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

## โมเดลเริ่มต้น

โมเดลเริ่มต้นคือ `kilocode/kilo/auto` ซึ่งเป็นโมเดลการกำหนดเส้นทางอัจฉริยะ
ที่ผู้ให้บริการเป็นเจ้าของและจัดการโดย Kilo Gateway

<Note>
OpenClaw ถือว่า `kilocode/kilo/auto` เป็น ref เริ่มต้นที่เสถียร แต่ไม่ได้
เผยแพร่การจับคู่งานไปยังโมเดลต้นทางที่มีแหล่งที่มารองรับสำหรับเส้นทางนั้น การกำหนด
เส้นทางต้นทางที่แน่นอนหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้
ฮาร์ดโค้ดไว้ใน OpenClaw
</Note>

## แค็ตตาล็อกในตัว

OpenClaw ค้นหาโมเดลที่มีอยู่จาก Kilo Gateway แบบไดนามิกเมื่อเริ่มต้น ใช้
`/models kilocode` เพื่อดูรายการโมเดลทั้งหมดที่บัญชีของคุณใช้งานได้

โมเดลใดๆ ที่มีอยู่บน Gateway สามารถใช้กับคำนำหน้า `kilocode/` ได้:

| ref ของโมเดล                           | หมายเหตุ                           |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | ค่าเริ่มต้น — การกำหนดเส้นทางอัจฉริยะ |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic ผ่าน Kilo                |
| `kilocode/openai/gpt-5.5`                | OpenAI ผ่าน Kilo                   |
| `kilocode/google/gemini-3.1-pro-preview` | Google ผ่าน Kilo                   |
| ...และอื่นๆ อีกมากมาย                  | ใช้ `/models kilocode` เพื่อแสดงทั้งหมด |

<Tip>
เมื่อเริ่มต้น OpenClaw จะเรียก `GET https://api.kilo.ai/api/gateway/models` และผสาน
โมเดลที่ค้นพบไว้ก่อนแค็ตตาล็อกสำรองแบบคงที่ แค็ตตาล็อกสำรองแบบคงที่จะมี
`kilocode/kilo/auto` (`Kilo Auto`) พร้อม `input: ["text", "image"]`,
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
  <Accordion title="การขนส่งและความเข้ากันได้">
    Kilo Gateway มีเอกสารในซอร์สว่าเข้ากันได้กับ OpenRouter ดังนั้นจึงยังคงอยู่บน
    เส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซี แทนการจัดรูปแบบคำขอ OpenAI แบบเนทีฟ

    - ref ของ Kilo ที่อิงกับ Gemini ยังคงอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw จึงคง
      การทำความสะอาด thought-signature ของ Gemini ไว้ที่นั่น โดยไม่เปิดใช้การตรวจสอบ
      การเล่นซ้ำ Gemini แบบเนทีฟหรือการเขียน bootstrap ใหม่
    - Kilo Gateway ใช้ Bearer token กับคีย์ API ของคุณภายใต้กลไกเบื้องหลัง

  </Accordion>

  <Accordion title="ตัวห่อสตรีมและการให้เหตุผล">
    ตัวห่อสตรีมที่ใช้ร่วมกันของ Kilo เพิ่มส่วนหัวแอปของผู้ให้บริการและทำให้
    payload การให้เหตุผลของพร็อกซีเป็นมาตรฐานสำหรับ ref ของโมเดลแบบเจาะจงที่รองรับ

    <Warning>
    `kilocode/kilo/auto` และคำใบ้อื่นๆ ที่ไม่รองรับ proxy-reasoning จะข้ามการ
    แทรกการให้เหตุผล หากคุณต้องการการรองรับการให้เหตุผล ให้ใช้ ref ของโมเดลแบบเจาะจง เช่น
    `kilocode/anthropic/claude-sonnet-4`
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากการค้นหาโมเดลล้มเหลวเมื่อเริ่มต้น OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกแบบคงที่ที่มี `kilocode/kilo/auto`
    - ตรวจสอบว่าคีย์ API ของคุณถูกต้อง และบัญชี Kilo ของคุณเปิดใช้โมเดลที่ต้องการแล้ว
    - เมื่อ Gateway รันเป็น daemon ให้ตรวจสอบว่า `KILOCODE_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ ref ของโมเดล และพฤติกรรมการสลับเมื่อเกิดความล้มเหลว
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่า OpenClaw ฉบับเต็ม
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Kilo Gateway, คีย์ API และการจัดการบัญชี
  </Card>
</CardGroup>
