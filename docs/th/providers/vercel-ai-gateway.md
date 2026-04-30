---
read_when:
    - คุณต้องการใช้ Vercel AI Gateway กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Vercel AI Gateway (การยืนยันตัวตน + การเลือกโมเดล)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-30T10:13:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) มี API แบบรวมศูนย์เพื่อ
เข้าถึงโมเดลหลายร้อยรายการผ่าน endpoint เดียว

| คุณสมบัติ      | ค่า                            |
| ------------- | -------------------------------- |
| ผู้ให้บริการ      | `vercel-ai-gateway`              |
| การยืนยันตัวตน          | `AI_GATEWAY_API_KEY`             |
| API           | เข้ากันได้กับ Anthropic Messages    |
| แค็ตตาล็อกโมเดล | ค้นพบอัตโนมัติผ่าน `/v1/models` |

<Tip>
OpenClaw ค้นพบแค็ตตาล็อก Gateway `/v1/models` โดยอัตโนมัติ ดังนั้น
`/models vercel-ai-gateway` จึงรวม model refs ปัจจุบัน เช่น
`vercel-ai-gateway/openai/gpt-5.5` และ
`vercel-ai-gateway/moonshotai/kimi-k2.6`
</Tip>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    เรียกใช้ onboarding แล้วเลือกตัวเลือกการยืนยันตัวตนของ AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
    เพิ่มโมเดลลงในการกำหนดค่า OpenClaw ของคุณ:

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

สำหรับการตั้งค่าด้วยสคริปต์หรือ CI ให้ส่งค่าทั้งหมดผ่านบรรทัดคำสั่ง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## รูปแบบย่อของ Model ID

OpenClaw ยอมรับ Vercel Claude shorthand model refs และทำให้เป็นรูปแบบมาตรฐานใน
runtime:

| อินพุตแบบย่อ                     | model ref ที่ทำให้เป็นรูปแบบมาตรฐาน                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
คุณสามารถใช้ได้ทั้งรูปแบบย่อหรือ model ref แบบเต็มในการ
กำหนดค่าของคุณ OpenClaw จะแปลงเป็นรูปแบบ canonical โดยอัตโนมัติ
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับ daemon processes">
    หาก OpenClaw Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `AI_GATEWAY_API_KEY` พร้อมใช้งานสำหรับ process นั้น

    <Warning>
    key ที่ตั้งค่าไว้เฉพาะใน `~/.profile` จะไม่ปรากฏแก่ daemon ของ launchd/systemd
    เว้นแต่จะนำเข้า environment นั้นอย่างชัดเจน ตั้งค่า key ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่า gateway process สามารถ
    อ่านได้
    </Warning>

  </Accordion>

  <Accordion title="การกำหนดเส้นทางของผู้ให้บริการ">
    Vercel AI Gateway กำหนดเส้นทางคำขอไปยัง upstream provider ตาม prefix ของ model
    ref ตัวอย่างเช่น `vercel-ai-gateway/anthropic/claude-opus-4.6` จะถูกกำหนดเส้นทาง
    ผ่าน Anthropic ส่วน `vercel-ai-gateway/openai/gpt-5.5` จะถูกกำหนดเส้นทางผ่าน
    OpenAI และ `vercel-ai-gateway/moonshotai/kimi-k2.6` จะถูกกำหนดเส้นทางผ่าน
    MoonshotAI `AI_GATEWAY_API_KEY` เดียวของคุณจัดการการยืนยันตัวตนสำหรับ
    upstream providers ทั้งหมด
  </Accordion>
  <Accordion title="ระดับการคิด">
    ตัวเลือก `/think` จะทำตาม prefixes ของ upstream model ที่เชื่อถือได้เมื่อ OpenClaw รู้
    สัญญาของ upstream provider `vercel-ai-gateway/anthropic/...` ใช้
    Claude thinking profile รวมถึงค่าเริ่มต้นแบบปรับตัวได้สำหรับโมเดล Claude 4.6
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` และ refs แบบ Codex จะแสดง
    `/think xhigh` เช่นเดียวกับผู้ให้บริการ OpenAI/OpenAI Codex โดยตรง ส่วน
    refs แบบ namespaced อื่นจะคงระดับ reasoning ปกติไว้ เว้นแต่ metadata ของแค็ตตาล็อกจะประกาศไว้มากกว่านั้น
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model refs และพฤติกรรม failover
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
