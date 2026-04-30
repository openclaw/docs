---
read_when:
    - คุณต้องการใช้ Together AI กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการตรวจสอบสิทธิ์ของ CLI
summary: การตั้งค่า Together AI (การยืนยันตัวตน + การเลือกรุ่นโมเดล)
title: Together AI
x-i18n:
    generated_at: "2026-04-30T10:13:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) ให้การเข้าถึงโมเดลโอเพนซอร์สชั้นนำ
รวมถึง Llama, DeepSeek, Kimi และอื่น ๆ ผ่าน API แบบรวมศูนย์

| คุณสมบัติ | ค่า                          |
| -------- | ----------------------------- |
| ผู้ให้บริการ | `together`                    |
| การยืนยันตัวตน | `TOGETHER_API_KEY`            |
| API      | เข้ากันได้กับ OpenAI             |
| URL พื้นฐาน | `https://api.together.xyz/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key">
    สร้าง API key ที่
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="ตั้งค่าโมเดลเริ่มต้น">
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

### ตัวอย่างแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
พรีเซ็ตการเริ่มต้นใช้งานตั้งค่า `together/moonshotai/Kimi-K2.5` เป็นโมเดลเริ่มต้น
</Note>

## แค็ตตาล็อกในตัว

OpenClaw มาพร้อมกับแค็ตตาล็อก Together ที่รวมมาให้ดังนี้:

| อ้างอิงโมเดล                                                | ชื่อ                                   | อินพุต      | บริบท      | หมายเหตุ                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | ข้อความ, รูปภาพ | 262,144    | โมเดลเริ่มต้น; เปิดใช้การให้เหตุผล |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | ข้อความ     | 202,752    | โมเดลข้อความอเนกประสงค์       |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | ข้อความ     | 131,072    | โมเดลคำสั่งที่รวดเร็ว           |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | ข้อความ, รูปภาพ | 10,000,000 | มัลติโมดัล                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | ข้อความ, รูปภาพ | 20,000,000 | มัลติโมดัล                       |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | ข้อความ     | 131,072    | โมเดลข้อความทั่วไป               |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | ข้อความ     | 131,072    | โมเดลการให้เหตุผล                |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | ข้อความ     | 262,144    | โมเดลข้อความ Kimi สำรอง        |

## การสร้างวิดีโอ

Plugin `together` ที่รวมมาให้ยังลงทะเบียนการสร้างวิดีโอผ่าน
เครื่องมือ `video_generate` ที่ใช้ร่วมกันด้วย

| คุณสมบัติ             | ค่า                                   |
| -------------------- | ------------------------------------- |
| โมเดลวิดีโอเริ่มต้น  | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| โหมด                 | ข้อความเป็นวิดีโอ, อ้างอิงรูปภาพเดียว |
| พารามิเตอร์ที่รองรับ | `aspectRatio`, `resolution`           |

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน
การเลือกผู้ให้บริการ และพฤติกรรมการสลับไปใช้ตัวสำรอง
</Tip>

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `TOGETHER_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะในเชลล์แบบโต้ตอบของคุณจะไม่ปรากฏต่อโปรเซส gateway
    ที่จัดการโดย daemon ใช้การกำหนดค่า `~/.openclaw/.env` หรือ `env.shellEnv`
    เพื่อให้พร้อมใช้งานอย่างต่อเนื่อง
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - ตรวจสอบว่าคีย์ของคุณใช้งานได้: `openclaw models list --provider together`
    - หากโมเดลไม่ปรากฏ ให้ยืนยันว่า API key ถูกตั้งค่าในสภาพแวดล้อมที่ถูกต้อง
      สำหรับโปรเซส Gateway ของคุณ
    - การอ้างอิงโมเดลใช้รูปแบบ `together/<model-id>`

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    กฎของผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือสร้างวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าแบบเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Together AI, เอกสาร API และราคา
  </Card>
</CardGroup>
