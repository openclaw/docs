---
read_when:
    - คุณต้องการใช้ Vercel AI Gateway กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า Vercel AI Gateway (การยืนยันตัวตน + การเลือกโมเดล)
title: เกตเวย์ AI ของ Vercel
x-i18n:
    generated_at: "2026-07-12T16:40:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) มี API แบบรวมศูนย์สำหรับ
เข้าถึงโมเดลหลายร้อยรายการผ่านปลายทางเดียว

| คุณสมบัติ       | ค่า                                    |
| --------------- | -------------------------------------- |
| ผู้ให้บริการ     | `vercel-ai-gateway`                    |
| แพ็กเกจ          | `@openclaw/vercel-ai-gateway-provider` |
| การยืนยันตัวตน   | `AI_GATEWAY_API_KEY`                   |
| API             | รองรับ Anthropic Messages              |
| URL ฐาน          | `https://ai-gateway.vercel.sh`         |
| แค็ตตาล็อกโมเดล | ค้นพบอัตโนมัติผ่าน `/v1/models`        |

<Tip>
OpenClaw ค้นพบแค็ตตาล็อก `/v1/models` ของ Gateway โดยอัตโนมัติ ดังนั้นทั้ง
คำสั่งแชต `/models vercel-ai-gateway` และ
`openclaw models list --provider vercel-ai-gateway` จึงแสดงการอ้างอิงโมเดลปัจจุบัน
เช่น `vercel-ai-gateway/openai/gpt-5.5` และ
`vercel-ai-gateway/moonshotai/kimi-k2.6`
</Tip>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="ตั้งค่าคีย์ API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## ตัวอย่างแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## รูปแบบย่อของรหัสโมเดล

OpenClaw ปรับการอ้างอิงโมเดล Claude แบบย่อให้เป็นรูปแบบมาตรฐานขณะรันไทม์:

| อินพุตแบบย่อ                       | การอ้างอิงโมเดลหลังปรับรูปแบบ                |
| ---------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
ใช้รูปแบบใดก็ได้ในการกำหนดค่าของคุณ OpenClaw จะแปลงเป็นการอ้างอิงมาตรฐาน
`anthropic/...` โดยอัตโนมัติ
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับกระบวนการดีมอน">
    หาก OpenClaw Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบว่า
    กระบวนการนั้นเข้าถึง `AI_GATEWAY_API_KEY` ได้

    <Warning>
    คีย์ที่ส่งออกเฉพาะในเชลล์แบบโต้ตอบจะไม่ปรากฏต่อดีมอน
    launchd/systemd เว้นแต่จะนำเข้าสภาพแวดล้อมนั้นอย่างชัดเจน ให้ตั้งค่า
    คีย์ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่ากระบวนการ Gateway
    สามารถอ่านคีย์ได้
    </Warning>

  </Accordion>

  <Accordion title="การกำหนดเส้นทางผู้ให้บริการ">
    Vercel AI Gateway กำหนดเส้นทางคำขอแต่ละรายการไปยังผู้ให้บริการต้นทางที่ระบุใน
    คำนำหน้าการอ้างอิงโมเดล ตัวอย่างเช่น `vercel-ai-gateway/anthropic/claude-opus-4.6`
    จะกำหนดเส้นทางผ่าน Anthropic, `vercel-ai-gateway/openai/gpt-5.5` จะกำหนดเส้นทางผ่าน
    OpenAI และ `vercel-ai-gateway/moonshotai/kimi-k2.6` จะกำหนดเส้นทางผ่าน
    MoonshotAI โดย `AI_GATEWAY_API_KEY` หนึ่งคีย์ใช้ยืนยันตัวตนกับผู้ให้บริการต้นทางทั้งหมด
  </Accordion>
  <Accordion title="ระดับการคิด">
    ตัวเลือก `/think` จะอิงตามคำนำหน้าโมเดลต้นทางเมื่อ OpenClaw
    รู้จักคำนำหน้านั้น `vercel-ai-gateway/anthropic/...` ใช้โปรไฟล์การคิดของ Claude
    รวมถึงค่าเริ่มต้นแบบปรับเปลี่ยนได้สำหรับโมเดล Claude 4.6 การอ้างอิง
    `vercel-ai-gateway/openai/...` ที่เชื่อถือได้ (`gpt-5.2` และรุ่นใหม่กว่า รวมถึงรุ่นย่อย Codex
    ย้อนลงไปถึง `gpt-5.1-codex`) จะแสดงตัวเลือก `/think xhigh` การอ้างอิงที่มีเนมสเปซอื่น
    จะคงระดับการใช้เหตุผลมาตรฐานไว้ เว้นแต่ข้อมูลเมตาของแค็ตตาล็อก
    จะระบุระดับเพิ่มเติม
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
