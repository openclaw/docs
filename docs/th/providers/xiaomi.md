---
read_when:
    - คุณต้องการใช้โมเดล Xiaomi MiMo ใน OpenClaw
    - คุณต้องตั้งค่าการยืนยันตัวตน Xiaomi MiMo หรือ Token Plan
summary: ใช้โมเดลแบบจ่ายตามการใช้งานและ Token Plan ของ Xiaomi MiMo กับ OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:18:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo คือแพลตฟอร์ม API สำหรับโมเดล **MiMo** OpenClaw มี Xiaomi plugin ที่บันเดิลมาให้พร้อมพรีเซ็ตผู้ให้บริการข้อความสองแบบ:

- `xiaomi` สำหรับคีย์แบบจ่ายตามการใช้งาน (`sk-...`)
- `xiaomi-token-plan` สำหรับคีย์ Token Plan (`tp-...`) พร้อมพรีเซ็ตเอนด์พอยต์ตามภูมิภาค

Plugin เดียวกันนี้ยังลงทะเบียนผู้ให้บริการเสียงพูด (TTS) `xiaomi` ด้วย

| คุณสมบัติ | ค่า |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ | `xiaomi` (จ่ายตามการใช้งาน), `xiaomi-token-plan` (Token Plan) |
| Plugin | บันเดิลมาให้, `enabledByDefault: true` |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY` |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| แฟล็ก CLI โดยตรง | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>` |
| สัญญา | chat completions + `speechProviders` |
| API | เข้ากันได้กับ OpenAI (`openai-completions`) |
| URL ฐาน | จ่ายตามการใช้งาน: `https://api.xiaomimimo.com/v1`; พรีเซ็ต Token Plan: `token-plan-{cn,sgp,ams}...` |
| โมเดลเริ่มต้น | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro` |
| ค่าเริ่มต้น TTS | `mimo-v2.5-tts`, เสียง `mimo_default`; โมเดล voicedesign `mimo-v2.5-tts-voicedesign` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ที่ถูกต้อง">
    สร้างคีย์แบบจ่ายตามการใช้งานใน [คอนโซล Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) หรือเปิดหน้าการสมัครสมาชิก Token Plan ของคุณ แล้วคัดลอก URL ฐานที่เข้ากันได้กับ OpenAI ตามภูมิภาค พร้อมคีย์ `tp-...` ที่ตรงกัน
  </Step>

  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
    จ่ายตามการใช้งาน:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    หรือส่งคีย์โดยตรง:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## แคตตาล็อกแบบจ่ายตามการใช้งาน

| อ้างอิงโมเดล | อินพุต | บริบท | เอาต์พุตสูงสุด | การให้เหตุผล | หมายเหตุ |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | ข้อความ | 262,144 | 8,192 | ไม่ | โมเดลเริ่มต้น |
| `xiaomi/mimo-v2-pro` | ข้อความ | 1,048,576 | 32,000 | ใช่ | บริบทขนาดใหญ่ |
| `xiaomi/mimo-v2-omni` | ข้อความ, รูปภาพ | 262,144 | 32,000 | ใช่ | มัลติโหมด |

<Tip>
อ้างอิงโมเดลเริ่มต้นคือ `xiaomi/mimo-v2-flash` ผู้ให้บริการจะถูกฉีดเข้าโดยอัตโนมัติเมื่อมีการตั้งค่า `XIAOMI_API_KEY` หรือมีโปรไฟล์การยืนยันตัวตนอยู่
</Tip>

## แคตตาล็อก Token Plan

เลือกตัวเลือกการยืนยันตัวตน Token Plan ที่ตรงกับ URL ฐานตามภูมิภาคที่แสดงใน UI การสมัครสมาชิกของ Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| อ้างอิงโมเดล | อินพุต | บริบท | เอาต์พุตสูงสุด | การให้เหตุผล | หมายเหตุ |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | ข้อความ | 1,048,576 | 131,072 | ใช่ | โมเดลเริ่มต้น |
| `xiaomi-token-plan/mimo-v2.5` | ข้อความ, รูปภาพ | 1,048,576 | 131,072 | ใช่ | มัลติโหมด |

<Tip>
การเริ่มต้นใช้งาน Token Plan จะตรวจสอบรูปแบบคีย์และเตือนเมื่อป้อนคีย์ `tp-...` ในเส้นทางแบบจ่ายตามการใช้งาน หรือป้อนคีย์ `sk-...` ในเส้นทาง Token Plan
</Tip>

## แปลงข้อความเป็นเสียงพูด

Plugin `xiaomi` ที่บันเดิลมาให้ยังลงทะเบียน Xiaomi MiMo เป็นผู้ให้บริการเสียงพูดสำหรับ
`messages.tts` ด้วย โดยเรียกสัญญา TTS แบบ chat-completions ของ Xiaomi ด้วยข้อความในฐานะ
ข้อความ `assistant` และคำแนะนำสไตล์ที่เป็นตัวเลือกในฐานะข้อความ `user`

| คุณสมบัติ | ค่า |
| -------- | ---------------------------------------- |
| รหัส TTS | `xiaomi` (นามแฝง `mimo`) |
| การยืนยันตัวตน | `XIAOMI_API_KEY` |
| API | `POST /v1/chat/completions` พร้อม `audio` |
| ค่าเริ่มต้น | `mimo-v2.5-tts`, เสียง `mimo_default` |
| เอาต์พุต | MP3 ตามค่าเริ่มต้น; WAV เมื่อกำหนดค่าไว้ |

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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

เสียงในตัวที่รองรับได้แก่ `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` และ `Dean` โมเดลเสียงพรีเซ็ตใช้ `audio.voice` ดังนั้น
OpenClaw จึงส่ง `speakerVoice` สำหรับ `mimo-v2.5-tts` และ `mimo-v2-tts`

โมเดล voicedesign ของ Xiaomi คือ `mimo-v2.5-tts-voicedesign` จะสร้างเสียง
จากพรอมป์สไตล์ภาษาธรรมชาติแทนรหัสเสียงพรีเซ็ต กำหนดค่า
`style` ด้วยคำอธิบายเสียงที่ต้องการ; OpenClaw จะส่งค่านี้เป็นข้อความ `user`
ส่งข้อความที่ต้องพูดเป็นข้อความ `assistant` และละเว้น
`audio.voice` สำหรับโมเดลนี้

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

สำหรับเป้าหมายบันทึกเสียง เช่น Feishu และ Telegram, OpenClaw จะแปลงรหัสเอาต์พุตของ Xiaomi
เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่งมอบ

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

ราคาและแฟล็กความเข้ากันได้มาจาก manifest ของ plugin ที่บันเดิลมาให้ ดังนั้นตัวอย่างการกำหนดค่าจึงละเว้น `cost` และ `compat` เพื่อหลีกเลี่ยงการเบี่ยงเบนจากพฤติกรรมรันไทม์

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

ราคามาจาก manifest ที่บันเดิลมาให้ (โมเดล Token Plan มีการกำหนดราคาอ่านแคชแบบแบ่งระดับ) ดังนั้นตัวอย่างการกำหนดค่าจึงละเว้น `cost`

<AccordionGroup>
  <Accordion title="พฤติกรรมการฉีดเข้าอัตโนมัติ">
    ผู้ให้บริการ `xiaomi` จะถูกฉีดเข้าโดยอัตโนมัติเมื่อมีการตั้งค่า `XIAOMI_API_KEY` ในสภาพแวดล้อมของคุณ หรือมีโปรไฟล์การยืนยันตัวตนอยู่ `xiaomi-token-plan` ต้องใช้ URL ฐานตามภูมิภาค ดังนั้นเส้นทางที่รองรับคือการเลือกเริ่มต้นใช้งาน Token Plan ที่บันเดิลมาให้ หรือบล็อกการกำหนดค่า `models.providers.xiaomi-token-plan` แบบชัดเจน
  </Accordion>

  <Accordion title="รายละเอียดโมเดล">
    - **mimo-v2-flash** — น้ำหนักเบาและเร็ว เหมาะสำหรับงานข้อความทั่วไป ไม่รองรับการให้เหตุผล
    - **mimo-v2-pro** — รองรับการให้เหตุผลด้วยหน้าต่างบริบท 1M token สำหรับเวิร์กโหลดเอกสารยาว
    - **mimo-v2-omni** — โมเดลมัลติโหมดที่เปิดใช้การให้เหตุผลและรับได้ทั้งอินพุตข้อความและรูปภาพ
    - **mimo-v2.5-pro** — ค่าเริ่มต้นของ Token Plan พร้อมสแต็กการให้เหตุผล V2.5 ปัจจุบันของ Xiaomi
    - **mimo-v2.5** — เส้นทางมัลติโหมด V2.5 ของ Token Plan

    <Note>
    โมเดลแบบจ่ายตามการใช้งานใช้คำนำหน้า `xiaomi/` โมเดล Token Plan ใช้คำนำหน้า `xiaomi-token-plan/`
    </Note>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากโมเดลไม่ปรากฏ ให้ยืนยันว่ามีตัวแปรสภาพแวดล้อมของคีย์ที่เกี่ยวข้องหรือโปรไฟล์การยืนยันตัวตน และค่านั้นถูกต้อง
    - สำหรับ Token Plan ให้ยืนยันว่าภูมิภาคการเริ่มต้นใช้งานที่เลือกตรงกับ URL ฐานในหน้าการสมัครสมาชิก และคีย์ขึ้นต้นด้วย `tp-`
    - เมื่อ Gateway ทำงานเป็นดีมอน ให้ตรวจสอบว่าคีย์พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะในเชลล์แบบโต้ตอบของคุณจะไม่ปรากฏต่อโปรเซส Gateway ที่จัดการโดยดีมอน ใช้การกำหนดค่า `~/.openclaw/.env` หรือ `env.shellEnv` เพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ อ้างอิงโมเดล และพฤติกรรมการเฟลโอเวอร์
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่า OpenClaw ฉบับเต็ม
  </Card>
  <Card title="คอนโซล Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Xiaomi MiMo และการจัดการคีย์ API
  </Card>
</CardGroup>
