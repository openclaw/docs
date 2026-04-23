---
read_when:
    - คุณต้องการใช้ Volcano Engine หรือ Doubao models กับ OpenClaw
    - คุณต้องการการตั้งค่า Volcengine API key
summary: การตั้งค่า Volcano Engine (Doubao models, endpoints ทั่วไป + สำหรับโค้ด)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T10:23:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

provider ของ Volcengine ให้การเข้าถึง Doubao models และ third-party models
ที่โฮสต์บน Volcano Engine โดยมี endpoints แยกกันสำหรับงานทั่วไปและงานด้านโค้ด

| รายละเอียด | ค่า                                                  |
| ---------- | ---------------------------------------------------- |
| Providers  | `volcengine` (ทั่วไป) + `volcengine-plan` (โค้ด)     |
| Auth       | `VOLCANO_ENGINE_API_KEY`                             |
| API        | เข้ากันได้กับ OpenAI                                |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    รัน onboarding แบบโต้ตอบ:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    การทำเช่นนี้จะลงทะเบียนทั้ง providers สำหรับงานทั่วไป (`volcengine`) และงานโค้ด (`volcengine-plan`) จาก API key เดียว

  </Step>
  <Step title="ตั้งค่า model เริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่า model พร้อมใช้งาน">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
สำหรับการตั้งค่าแบบ non-interactive (CI, สคริปต์) ให้ส่ง key โดยตรง:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Providers และ endpoints

| Provider          | Endpoint                                  | กรณีใช้งาน    |
| ----------------- | ----------------------------------------- | ------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | models ทั่วไป |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | models สำหรับโค้ด |

<Note>
ทั้งสอง providers ถูกกำหนดค่าจาก API key เดียว การตั้งค่าจะลงทะเบียนทั้งคู่โดยอัตโนมัติ
</Note>

## models ที่พร้อมใช้งาน

<Tabs>
  <Tab title="ทั่วไป (volcengine)">
    | Model ref                                    | ชื่อ                            | อินพุต      | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | ข้อความ, ภาพ | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | ข้อความ, ภาพ | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | ข้อความ, ภาพ | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | ข้อความ, ภาพ | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | ข้อความ, ภาพ | 128,000 |
  </Tab>
  <Tab title="สำหรับโค้ด (volcengine-plan)">
    | Model ref                                         | ชื่อ                     | อินพุต   | Context |
    | ------------------------------------------------- | ------------------------ | -------- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | ข้อความ  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | ข้อความ  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | ข้อความ  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | ข้อความ  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | ข้อความ  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | ข้อความ  | 256,000 |
  </Tab>
</Tabs>

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="model เริ่มต้นหลัง onboarding">
    ปัจจุบัน `openclaw onboard --auth-choice volcengine-api-key` จะตั้ง
    `volcengine-plan/ark-code-latest` เป็น model เริ่มต้น พร้อมทั้งลงทะเบียน
    แค็ตตาล็อก `volcengine` สำหรับงานทั่วไปด้วย
  </Accordion>

  <Accordion title="พฤติกรรม fallback ของตัวเลือก model">
    ระหว่าง onboarding/การตั้งค่าเพื่อเลือก model ตัวเลือก auth ของ Volcengine จะให้ความสำคัญกับ
    แถว `volcengine/*` และ `volcengine-plan/*` ทั้งคู่ หาก models เหล่านั้นยังไม่ถูกโหลด
    OpenClaw จะ fallback ไปยังแค็ตตาล็อกที่ไม่กรอง แทนการแสดงตัวเลือกแบบจำกัดขอบเขต provider ที่ว่างเปล่า
  </Accordion>

  <Accordion title="Environment variables สำหรับ daemon processes">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `VOLCANO_ENGINE_API_KEY` พร้อมใช้งานสำหรับ process นั้น (เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>
</AccordionGroup>

<Warning>
เมื่อรัน OpenClaw เป็น background service environment variables ที่ตั้งไว้ใน
interactive shell ของคุณจะไม่ถูกสืบทอดไปโดยอัตโนมัติ ดูหมายเหตุเรื่อง daemon ด้านบน
</Warning>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config ฉบับเต็มสำหรับ agents, models และ providers
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
  <Card title="FAQ" href="/th/help/faq" icon="circle-question">
    คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า OpenClaw
  </Card>
</CardGroup>
