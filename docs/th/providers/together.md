---
read_when:
    - คุณต้องการใช้ Together AI กับ OpenClaw
    - คุณต้องการตัวแปรสภาพแวดล้อมสำหรับ API key หรือตัวเลือกการยืนยันตัวตนใน CLI
summary: การตั้งค่า Together AI (การยืนยันตัวตน + การเลือก model)
title: Together AI
x-i18n:
    generated_at: "2026-04-24T09:30:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a11f212fbef79e399d4a50cec88150bf0b7abf80ad765f0a617786bb051c8e
    source_path: providers/together.md
    workflow: 15
---

[Together AI](https://together.ai) ให้การเข้าถึงโมเดลโอเพนซอร์สชั้นนำ
รวมถึง Llama, DeepSeek, Kimi และอื่น ๆ ผ่าน API แบบรวมศูนย์

| คุณสมบัติ | ค่า                          |
| -------- | ---------------------------- |
| Provider | `together`                   |
| Auth     | `TOGETHER_API_KEY`           |
| API      | เข้ากันได้กับ OpenAI         |
| Base URL | `https://api.together.xyz/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key">
    สร้าง API key ได้ที่
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="ตั้ง model เริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### ตัวอย่างแบบ non-interactive

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
preset ของ onboarding จะตั้ง `together/moonshotai/Kimi-K2.5` เป็น model
เริ่มต้น
</Note>

## แคตตาล็อกในตัว

OpenClaw มาพร้อมแคตตาล็อก Together ดังนี้:

| Model ref                                                    | ชื่อ                                   | อินพุต      | คอนเท็กซ์   | หมายเหตุ                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | text, image | 262,144    | model เริ่มต้น; เปิดใช้ reasoning |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | text        | 202,752    | model ข้อความอเนกประสงค์        |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | model คำสั่งที่รวดเร็ว           |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | multimodal                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | multimodal                       |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | text        | 131,072    | model ข้อความทั่วไป              |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | text        | 131,072    | model แบบ reasoning             |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | text        | 262,144    | model ข้อความ Kimi รอง           |

## การสร้างวิดีโอ

Plugin `together` ที่มาพร้อมกันยังลงทะเบียนการสร้างวิดีโอผ่าน
tool `video_generate` ที่ใช้ร่วมกันด้วย

| คุณสมบัติ             | ค่า                                  |
| -------------------- | ------------------------------------ |
| model วิดีโอเริ่มต้น | `together/Wan-AI/Wan2.2-T2V-A14B`    |
| โหมด                 | text-to-video, อ้างอิงภาพเดี่ยว      |
| พารามิเตอร์ที่รองรับ | `aspectRatio`, `resolution`          |

หากต้องการใช้ Together เป็น provider วิดีโอเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของ tool ที่ใช้ร่วมกัน
การเลือก provider และพฤติกรรม failover
</Tip>

<AccordionGroup>
  <Accordion title="หมายเหตุเรื่องสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบว่า
    `TOGETHER_API_KEY` พร้อมใช้งานสำหรับ process นั้น (เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะใน shell แบบ interactive จะไม่สามารถมองเห็นได้โดย process ของ gateway
    ที่ถูกจัดการแบบ daemon ให้ใช้ `~/.openclaw/.env` หรือ config `env.shellEnv`
    เพื่อให้พร้อมใช้งานอย่างต่อเนื่อง
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - ตรวจสอบว่าคีย์ของคุณใช้งานได้: `openclaw models list --provider together`
    - หาก model ไม่ปรากฏ ให้ยืนยันว่า API key ถูกตั้งค่าไว้ในสภาพแวดล้อมที่ถูกต้อง
      สำหรับ process ของ Gateway ของคุณ
    - ref ของ model ใช้รูปแบบ `together/<model-id>`

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือก model" href="/th/concepts/model-providers" icon="layers">
    กฎของ provider, ref ของ model และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของ tool สำหรับการสร้างวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema config แบบเต็ม รวมถึงการตั้งค่าของ provider
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Together AI, เอกสาร API และราคา
  </Card>
</CardGroup>
