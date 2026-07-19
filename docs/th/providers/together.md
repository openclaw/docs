---
read_when:
    - คุณต้องการใช้ Together AI กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า Together AI (การยืนยันตัวตน + การเลือกโมเดล)
title: Together AI
x-i18n:
    generated_at: "2026-07-19T07:28:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9b08cae93c1ea7df46e1d2fbe78692f73bb3e56809122f70a56eec8b3dc5d8a4
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) ให้การเข้าถึงโมเดลโอเพนซอร์สชั้นนำ
ซึ่งรวมถึง Llama, DeepSeek, Kimi และอื่นๆ ผ่าน API แบบรวมศูนย์
OpenClaw รวมบริการนี้ไว้เป็นผู้ให้บริการ `together`

| คุณสมบัติ | ค่า                         |
| -------- | ----------------------------- |
| ผู้ให้บริการ | `together`                    |
| การยืนยันตัวตน     | `TOGETHER_API_KEY`            |
| API      | เข้ากันได้กับ OpenAI             |
| URL ฐาน | `https://api.together.xyz/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    สร้างคีย์ API ที่
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
  </Step>
  <Step title="ดำเนินการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
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
การเริ่มต้นใช้งานจะตั้ง `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` เป็น
โมเดลเริ่มต้น
</Note>

## แค็ตตาล็อกในตัว

ค่าใช้จ่ายเป็น USD ต่อหนึ่งล้านโทเค็น

| การอ้างอิงโมเดล                                          | ชื่อ                         | อินพุต       | บริบท | เอาต์พุตสูงสุด | ค่าใช้จ่าย (เข้า/ออก) | หมายเหตุ               |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ---------- | ------------- | ------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | ข้อความ        | 131,072 | 8,192      | 0.88 / 0.88   | โมเดลเริ่มต้น       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | ข้อความ, รูปภาพ | 262,144 | 32,768     | 1.20 / 4.50   | โมเดลการให้เหตุผล     |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | ข้อความ        | 512,000 | 8,192      | 2.10 / 4.40   | โมเดลการให้เหตุผล     |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | ข้อความ        | 32,768  | 8,192      | 0.30 / 0.30   | รวดเร็ว ไม่ใช้การให้เหตุผล |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | ข้อความ        | 202,752 | 8,192      | 1.40 / 4.40   | โมเดลการให้เหตุผล     |

## การสร้างวิดีโอ

Plugin `together` ที่รวมมาให้ยังลงทะเบียนการสร้างวิดีโอผ่าน
เครื่องมือ `video_generate` ที่ใช้ร่วมกันด้วย

| คุณสมบัติ             | ค่า                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| โมเดลวิดีโอเริ่มต้น  | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| โมเดลอื่นๆ         | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/hailuo-02`, `kwaivgI/kling-2.1-master`                 |
| โหมด                | ข้อความเป็นวิดีโอ; รูปภาพเป็นวิดีโอใช้ได้เฉพาะกับ `Wan-AI/Wan2.2-I2V-A14B` (รูปภาพอ้างอิงหนึ่งรูป) |
| ระยะเวลา             | 1-10 วินาที                                                                              |
| พารามิเตอร์ที่รองรับ | `size` (แยกวิเคราะห์เป็น `<width>x<height>`); ระบบจะไม่อ่าน `aspectRatio`/`resolution`            |

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
ดูพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรองได้ที่ [การสร้างวิดีโอ](/th/tools/video-generation)
</Tip>

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบว่า
    `TOGETHER_API_KEY` พร้อมใช้งานสำหรับกระบวนการนั้น (เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะในเชลล์แบบโต้ตอบจะไม่ปรากฏต่อกระบวนการ
    Gateway ที่จัดการโดยดีมอน ใช้การกำหนดค่า `~/.openclaw/.env` หรือ `env.shellEnv`
    เพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - ตรวจสอบว่าคีย์ใช้งานได้: `openclaw models list --provider together`
    - หากโมเดลไม่ปรากฏขึ้น ให้ยืนยันว่าตั้งค่าคีย์ API ใน
      สภาพแวดล้อมที่ถูกต้องสำหรับกระบวนการ Gateway แล้ว
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
    สคีมาการกำหนดค่าแบบเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด เอกสาร API และราคาของ Together AI
  </Card>
</CardGroup>
