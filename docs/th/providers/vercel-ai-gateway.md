---
read_when:
    - คุณต้องการใช้ Vercel AI Gateway กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมของ API key หรือตัวเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า Vercel AI Gateway (การยืนยันตัวตน + การเลือกโมเดล)
title: Gateway AI ของ Vercel
x-i18n:
    generated_at: "2026-06-27T18:17:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) มี API แบบรวมศูนย์เพื่อ
เข้าถึงโมเดลหลายร้อยรายการผ่าน endpoint เดียว

| คุณสมบัติ      | ค่า                                  |
| ------------- | -------------------------------------- |
| ผู้ให้บริการ      | `vercel-ai-gateway`                    |
| แพ็กเกจ       | `@openclaw/vercel-ai-gateway-provider` |
| การยืนยันตัวตน          | `AI_GATEWAY_API_KEY`                   |
| API           | เข้ากันได้กับ Anthropic Messages          |
| แค็ตตาล็อกโมเดล | ค้นพบอัตโนมัติผ่าน `/v1/models`       |

<Tip>
OpenClaw ค้นพบแค็ตตาล็อก Gateway `/v1/models` โดยอัตโนมัติ ดังนั้น
`/models vercel-ai-gateway` จึงมีการอ้างอิงโมเดลปัจจุบัน เช่น
`vercel-ai-gateway/openai/gpt-5.5` และ
`vercel-ai-gateway/moonshotai/kimi-k2.6`
</Tip>

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="ตั้งค่า API key">
    เรียกใช้การเริ่มต้นใช้งานและเลือกตัวเลือกการยืนยันตัวตน AI Gateway:

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

## รูปย่อ ID โมเดล

OpenClaw ยอมรับการอ้างอิงโมเดลรูปย่อของ Vercel Claude และทำให้เป็นรูปแบบมาตรฐานใน
runtime:

| อินพุตรูปย่อ                     | การอ้างอิงโมเดลที่ทำให้เป็นมาตรฐาน                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
คุณสามารถใช้ได้ทั้งรูปย่อหรือการอ้างอิงโมเดลแบบระบุครบถ้วนในการ
กำหนดค่าของคุณ OpenClaw จะแปลงเป็นรูปแบบมาตรฐานโดยอัตโนมัติ
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวแปรสภาพแวดล้อมสำหรับโปรเซส daemon">
    หาก OpenClaw Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `AI_GATEWAY_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น

    <Warning>
    key ที่ export เฉพาะในเชลล์แบบโต้ตอบจะไม่ปรากฏแก่
    daemon ของ launchd/systemd เว้นแต่จะนำเข้าสภาพแวดล้อมนั้นอย่างชัดเจน ตั้งค่า
    key ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv` เพื่อให้แน่ใจว่าโปรเซส gateway
    อ่านค่าได้
    </Warning>

  </Accordion>

  <Accordion title="การกำหนดเส้นทางผู้ให้บริการ">
    Vercel AI Gateway กำหนดเส้นทางคำขอไปยังผู้ให้บริการต้นทางตามคำนำหน้าการอ้างอิงโมเดล
    ตัวอย่างเช่น `vercel-ai-gateway/anthropic/claude-opus-4.6` จะกำหนดเส้นทาง
    ผ่าน Anthropic ขณะที่ `vercel-ai-gateway/openai/gpt-5.5` จะกำหนดเส้นทางผ่าน
    OpenAI และ `vercel-ai-gateway/moonshotai/kimi-k2.6` จะกำหนดเส้นทางผ่าน
    MoonshotAI `AI_GATEWAY_API_KEY` รายการเดียวของคุณจัดการการยืนยันตัวตนสำหรับ
    ผู้ให้บริการต้นทางทั้งหมด
  </Accordion>
  <Accordion title="ระดับการคิด">
    ตัวเลือก `/think` จะตามคำนำหน้าโมเดลต้นทางที่เชื่อถือได้เมื่อ OpenClaw รู้
    สัญญาของผู้ให้บริการต้นทาง `vercel-ai-gateway/anthropic/...` ใช้
    โปรไฟล์การคิดของ Claude รวมถึงค่าเริ่มต้นแบบปรับตัวได้สำหรับโมเดล Claude 4.6
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` และการอ้างอิงแบบ Codex
    เปิดให้ใช้ `/think xhigh` เหมือนกับผู้ให้บริการ OpenAI/OpenAI Codex โดยตรง การอ้างอิง
    ที่มี namespace อื่นจะคงระดับการให้เหตุผลตามปกติไว้ เว้นแต่ metadata ของแค็ตตาล็อก
    จะประกาศไว้มากกว่านั้น
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
