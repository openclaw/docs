---
read_when:
    - คุณต้องการใช้ Together AI กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Together AI (การยืนยันตัวตน + การเลือกโมเดล)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T16:37:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) ให้บริการเข้าถึงโมเดลโอเพนซอร์สชั้นนำ
รวมถึง Llama, DeepSeek, Kimi และอื่น ๆ ผ่าน API แบบรวมศูนย์
OpenClaw รวมบริการนี้มาเป็นผู้ให้บริการ `together`

| คุณสมบัติ | ค่า                           |
| -------- | ----------------------------- |
| ผู้ให้บริการ | `together`                    |
| การยืนยันตัวตน | `TOGETHER_API_KEY`            |
| API      | เข้ากันได้กับ OpenAI             |
| URL ฐาน | `https://api.together.xyz/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ที่
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
  </Step>
  <Step title="เรียกใช้การเริ่มต้นระบบ">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="กำหนดโมเดลเริ่มต้น">
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
การเริ่มต้นระบบจะกำหนด `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`
เป็นโมเดลเริ่มต้น
</Note>

## แค็ตตาล็อกในตัว

ค่าใช้จ่ายเป็นสกุลเงินดอลลาร์สหรัฐต่อหนึ่งล้านโทเค็น

| การอ้างอิงโมเดล                                      | ชื่อ                           | อินพุต       | บริบท | เอาต์พุตสูงสุด | ค่าใช้จ่าย (เข้า/ออก) | หมายเหตุ               |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ---------- | ------------- | ------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | ข้อความ        | 131,072 | 8,192      | 0.88 / 0.88   | โมเดลเริ่มต้น       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | ข้อความ, รูปภาพ | 262,144 | 32,768     | 1.20 / 4.50   | โมเดลการให้เหตุผล     |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | ข้อความ        | 512,000 | 8,192      | 2.10 / 4.40   | โมเดลการให้เหตุผล     |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | ข้อความ        | 32,768  | 8,192      | 0.30 / 0.30   | รวดเร็ว ไม่ใช้การให้เหตุผล |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | ข้อความ        | 202,752 | 8,192      | 1.40 / 4.40   | โมเดลการให้เหตุผล     |

## การสร้างวิดีโอ

Plugin `together` ที่รวมมาให้ยังลงทะเบียนความสามารถในการสร้างวิดีโอผ่าน
เครื่องมือ `video_generate` ที่ใช้ร่วมกันด้วย

| คุณสมบัติ             | ค่า                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| โมเดลวิดีโอเริ่มต้น  | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| โมเดลอื่น ๆ         | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                    |
| โหมด                | ข้อความเป็นวิดีโอ; รูปภาพเป็นวิดีโอใช้ได้เฉพาะกับ `Wan-AI/Wan2.2-I2V-A14B` (รูปภาพอ้างอิงหนึ่งรูป) |
| ระยะเวลา             | 1-10 วินาที                                                                              |
| พารามิเตอร์ที่รองรับ | `size` (แยกวิเคราะห์ในรูปแบบ `<width>x<height>`); ไม่มีการอ่าน `aspectRatio`/`resolution`            |

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
ดู[การสร้างวิดีโอ](/th/tools/video-generation)สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน
การเลือกผู้ให้บริการ และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
</Tip>

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า
    กระบวนการนั้นสามารถเข้าถึง `TOGETHER_API_KEY` ได้ (ตัวอย่างเช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่กำหนดไว้เฉพาะในเชลล์แบบโต้ตอบของคุณจะไม่ปรากฏต่อกระบวนการ
    Gateway ที่จัดการโดยดีมอน ใช้การกำหนดค่า `~/.openclaw/.env` หรือ `env.shellEnv`
    เพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - ตรวจสอบว่าคีย์ของคุณใช้งานได้: `openclaw models list --provider together`
    - หากโมเดลไม่ปรากฏขึ้น ให้ยืนยันว่ากำหนดคีย์ API ในสภาพแวดล้อมที่ถูกต้อง
      สำหรับกระบวนการ Gateway ของคุณแล้ว
    - การอ้างอิงโมเดลใช้รูปแบบ `together/<model-id>`

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    กฎของผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือสร้างวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Together AI เอกสาร API และราคา
  </Card>
</CardGroup>
