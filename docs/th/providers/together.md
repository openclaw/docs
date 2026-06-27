---
read_when:
    - คุณต้องการใช้ Together AI กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Together AI (การยืนยันตัวตน + การเลือกโมเดล)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:17:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) ให้การเข้าถึงโมเดลโอเพนซอร์สชั้นนำ
รวมถึง Llama, DeepSeek, Kimi และอื่นๆ ผ่าน API แบบรวมศูนย์

| คุณสมบัติ | ค่า                          |
| -------- | ----------------------------- |
| ผู้ให้บริการ | `together`                    |
| การตรวจสอบสิทธิ์ | `TOGETHER_API_KEY`            |
| API      | เข้ากันได้กับ OpenAI             |
| URL ฐาน | `https://api.together.xyz/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Get an API key">
    สร้าง API key ที่
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### ตัวอย่างแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
พรีเซ็ตการเริ่มต้นใช้งานตั้ง
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` เป็นโมเดลเริ่มต้น
</Note>

## แค็ตตาล็อกในตัว

OpenClaw มาพร้อมแค็ตตาล็อก Together ที่บันเดิลไว้ดังนี้:

| อ้างอิงโมเดล                                          | ชื่อ                         | อินพุต       | บริบท | หมายเหตุ                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | ข้อความ        | 131,072 | โมเดลเริ่มต้น        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | ข้อความ, รูปภาพ | 262,144 | โมเดลให้เหตุผลของ Kimi |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | ข้อความ        | 512,000 | โมเดลข้อความสำหรับการให้เหตุผล |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | ข้อความ        | 32,768  | โมเดลข้อความที่รวดเร็ว      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | ข้อความ        | 202,752 | โมเดลข้อความสำหรับการให้เหตุผล |

## การสร้างวิดีโอ

Plugin `together` ที่บันเดิลไว้ยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ
`video_generate` ที่ใช้ร่วมกันด้วย

| คุณสมบัติ             | ค่า                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| โมเดลวิดีโอเริ่มต้น  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| โหมด                | ข้อความเป็นวิดีโอ; อ้างอิงด้วยภาพเดียวเท่านั้นเมื่อใช้ `Wan-AI/Wan2.2-I2V-A14B` |
| พารามิเตอร์ที่รองรับ | `aspectRatio`, `resolution`                                              |

หากต้องการใช้ Together เป็นผู้ให้บริการวิดีโอเริ่มต้น:

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน
การเลือกผู้ให้บริการ และพฤติกรรมการสลับเมื่อขัดข้อง
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `TOGETHER_API_KEY` พร้อมใช้งานสำหรับ process นั้น (เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะใน shell แบบโต้ตอบของคุณจะไม่ปรากฏต่อ process ของ
    Gateway ที่จัดการโดย daemon ใช้การกำหนดค่า `~/.openclaw/.env` หรือ
    `env.shellEnv` เพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - ตรวจสอบว่าคีย์ของคุณใช้งานได้: `openclaw models list --provider together`
    - หากโมเดลไม่ปรากฏ ให้ยืนยันว่า API key ถูกตั้งค่าใน environment ที่ถูกต้อง
      สำหรับ process ของ Gateway ของคุณ
    - การอ้างอิงโมเดลใช้รูปแบบ `together/<model-id>`

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    กฎของผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับเมื่อขัดข้อง
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือสร้างวิดีโอที่ใช้ร่วมกัน และการเลือกผู้ให้บริการ
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Together AI, เอกสาร API และราคา
  </Card>
</CardGroup>
