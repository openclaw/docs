---
read_when:
    - คุณต้องการโมเดล Xiaomi MiMo ใน OpenClaw
    - คุณต้องตั้งค่า XIAOMI_API_KEY
summary: ใช้โมเดล Xiaomi MiMo กับ OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T09:29:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo เป็นแพลตฟอร์ม API สำหรับโมเดล **MiMo** OpenClaw มี Plugin `xiaomi` ที่มาพร้อมในตัว ซึ่งลงทะเบียนทั้งผู้ให้บริการแชตที่เข้ากันได้กับ OpenAI และผู้ให้บริการเสียงพูด (TTS) โดยใช้ `XIAOMI_API_KEY` เดียวกัน

| คุณสมบัติ        | ค่า                                    |
| --------------- | ---------------------------------------- |
| รหัสผู้ให้บริการ     | `xiaomi`                                 |
| Plugin          | มาพร้อมในตัว, `enabledByDefault: true`        |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน    | `XIAOMI_API_KEY`                         |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice xiaomi-api-key`           |
| แฟล็ก CLI โดยตรง | `--xiaomi-api-key <key>`                 |
| สัญญา       | การเติมเต็มแชต + `speechProviders`     |
| API             | เข้ากันได้กับ OpenAI (`openai-completions`) |
| URL ฐาน        | `https://api.xiaomimimo.com/v1`          |
| โมเดลเริ่มต้น   | `xiaomi/mimo-v2-flash`                   |
| ค่าเริ่มต้น TTS     | `mimo-v2.5-tts`, เสียง `mimo_default`    |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Get an API key">
    สร้าง API key ใน [Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys)
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    หรือส่งคีย์โดยตรง:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## แคตตาล็อกในตัว

| การอ้างอิงโมเดล              | อินพุต       | บริบท   | เอาต์พุตสูงสุด | การให้เหตุผล | หมายเหตุ         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | ข้อความ        | 262,144   | 8,192      | ไม่        | โมเดลเริ่มต้น |
| `xiaomi/mimo-v2-pro`   | ข้อความ        | 1,048,576 | 32,000     | ใช่       | บริบทขนาดใหญ่ |
| `xiaomi/mimo-v2-omni`  | ข้อความ, รูปภาพ | 262,144   | 32,000     | ใช่       | หลายรูปแบบ    |

<Tip>
การอ้างอิงโมเดลเริ่มต้นคือ `xiaomi/mimo-v2-flash` ผู้ให้บริการจะถูกแทรกโดยอัตโนมัติเมื่อมีการตั้งค่า `XIAOMI_API_KEY` หรือมีโปรไฟล์การยืนยันตัวตนอยู่แล้ว
</Tip>

## ข้อความเป็นเสียงพูด

Plugin `xiaomi` ที่มาพร้อมในตัวยังลงทะเบียน Xiaomi MiMo เป็นผู้ให้บริการเสียงพูดสำหรับ
`messages.tts` ด้วย โดยจะเรียกสัญญา TTS แบบ chat-completions ของ Xiaomi พร้อมข้อความเป็น
ข้อความ `assistant` และคำแนะนำสไตล์ที่ไม่บังคับเป็นข้อความ `user`

| คุณสมบัติ | ค่า                                    |
| -------- | ---------------------------------------- |
| รหัส TTS   | `xiaomi` (นามแฝง `mimo`)                  |
| การยืนยันตัวตน     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` พร้อม `audio` |
| ค่าเริ่มต้น  | `mimo-v2.5-tts`, เสียง `mimo_default`    |
| เอาต์พุต   | MP3 โดยค่าเริ่มต้น; WAV เมื่อกำหนดค่า      |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

เสียงในตัวที่รองรับประกอบด้วย `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` และ `Dean` รองรับ `mimo-v2-tts` สำหรับบัญชี MiMo
TTS รุ่นเก่า; ค่าเริ่มต้นใช้โมเดล TTS MiMo-V2.5 ปัจจุบัน สำหรับเป้าหมาย
ข้อความเสียง เช่น Feishu และ Telegram, OpenClaw จะแปลงเอาต์พุตของ Xiaomi เป็น Opus 48kHz
ด้วย `ffmpeg` ก่อนส่งมอบ

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    ผู้ให้บริการ `xiaomi` จะถูกแทรกโดยอัตโนมัติเมื่อมีการตั้งค่า `XIAOMI_API_KEY` ในสภาพแวดล้อมของคุณ หรือมีโปรไฟล์การยืนยันตัวตนอยู่แล้ว คุณไม่จำเป็นต้องกำหนดค่าผู้ให้บริการด้วยตนเอง เว้นแต่ต้องการแทนที่เมตาดาตาของโมเดลหรือ URL ฐาน
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — เบาและเร็ว เหมาะสำหรับงานข้อความทั่วไป ไม่รองรับการให้เหตุผล
    - **mimo-v2-pro** — รองรับการให้เหตุผลด้วยหน้าต่างบริบท 1M โทเค็นสำหรับเวิร์กโหลดเอกสารยาว
    - **mimo-v2-omni** — โมเดลหลายรูปแบบที่เปิดใช้การให้เหตุผล ซึ่งรับได้ทั้งอินพุตข้อความและรูปภาพ

    <Note>
    โมเดลทั้งหมดใช้คำนำหน้า `xiaomi/` (เช่น `xiaomi/mimo-v2-pro`)
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - หากโมเดลไม่ปรากฏ ให้ยืนยันว่า `XIAOMI_API_KEY` ถูกตั้งค่าและถูกต้อง
    - เมื่อ Gateway ทำงานเป็น daemon ให้ตรวจสอบว่ากระบวนการนั้นเข้าถึงคีย์ได้ (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งค่าไว้เฉพาะในเชลล์แบบโต้ตอบของคุณจะไม่ปรากฏต่อกระบวนการ Gateway ที่จัดการโดย daemon ใช้การกำหนดค่า `~/.openclaw/.env` หรือ `env.shellEnv` เพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการเปลี่ยนไปใช้ตัวสำรอง
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw ฉบับเต็ม
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Xiaomi MiMo และการจัดการ API key
  </Card>
</CardGroup>
