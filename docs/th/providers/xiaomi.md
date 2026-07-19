---
read_when:
    - คุณต้องการโมเดล Xiaomi MiMo ใน OpenClaw
    - คุณต้องตั้งค่าการยืนยันตัวตนของ Xiaomi MiMo หรือ Token Plan
summary: ใช้โมเดลแบบจ่ายตามการใช้งานและ Token Plan ของ Xiaomi MiMo กับ OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-19T07:28:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 072e3772f5b6d49837a0909e982cb5a03bd532c4804b4eb2e94dc501e6aab58c
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo คือแพลตฟอร์ม API สำหรับโมเดล **MiMo** Plugin `xiaomi`
ที่รวมมาให้ (`enabledByDefault: true` ไม่ต้องติดตั้ง) จะลงทะเบียนผู้ให้บริการข้อความสองราย
และผู้ให้บริการเสียงพูด (TTS) หนึ่งราย:

- `xiaomi` - คีย์แบบจ่ายตามการใช้งาน (`sk-...`)
- `xiaomi-token-plan` - คีย์ Token Plan (`tp-...`) พร้อมค่าที่ตั้งไว้ล่วงหน้าสำหรับปลายทางตามภูมิภาค

| คุณสมบัติ         | ค่า                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ     | `xiaomi` (จ่ายตามการใช้งาน), `xiaomi-token-plan` (Token Plan)                                                                                         |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน    | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| แฟล็ก CLI โดยตรง | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API              | การเติมข้อความแชตที่เข้ากันได้กับ OpenAI (`openai-completions`)                                                                                          |
| สัญญาเสียงพูด  | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URL ฐาน        | จ่ายตามการใช้งาน: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                            |
| โมเดลเริ่มต้น   | `xiaomi/mimo-v2.5`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                              |
| ค่าเริ่มต้น TTS      | `mimo-v2.5-tts`, เสียง `mimo_default`; โมเดลออกแบบเสียง `mimo-v2.5-tts-voicedesign`                                                               |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ที่ถูกต้อง">
    สร้างคีย์แบบจ่ายตามการใช้งานใน [คอนโซล Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys) หรือเปิดหน้าการสมัครใช้บริการ Token Plan แล้วคัดลอก URL ฐานที่เข้ากันได้กับ OpenAI สำหรับภูมิภาค พร้อมคีย์ `tp-...` ที่ตรงกัน
  </Step>

  <Step title="ดำเนินการเริ่มต้นใช้งาน">
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

<Tip>
การเริ่มต้นใช้งานจะตรวจสอบรูปแบบคีย์และแจ้งเตือนเมื่อป้อนคีย์ `tp-...` ในเส้นทางแบบจ่ายตามการใช้งาน หรือป้อนคีย์ `sk-...` ในเส้นทาง Token Plan
</Tip>

## แค็ตตาล็อกแบบจ่ายตามการใช้งาน

| การอ้างอิงโมเดล              | อินพุต       | บริบท   | เอาต์พุตสูงสุด | การให้เหตุผล | หมายเหตุ         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2.5`     | ข้อความ, รูปภาพ | 1,048,576 | 131,072    | ใช่       | โมเดลเริ่มต้น |
| `xiaomi/mimo-v2.5-pro` | ข้อความ        | 1,048,576 | 131,072    | ใช่       | รุ่นเรือธง      |

## แค็ตตาล็อก Token Plan

เลือกตัวเลือกการยืนยันตัวตน Token Plan ที่ตรงกับ URL ฐานตามภูมิภาคซึ่งแสดงใน UI การสมัครใช้บริการของ Xiaomi:

| ตัวเลือกการยืนยันตัวตน             | URL ฐาน                                   |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| การอ้างอิงโมเดล                         | อินพุต       | บริบท   | เอาต์พุตสูงสุด | การให้เหตุผล | หมายเหตุ         |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | ข้อความ        | 1,048,576 | 131,072    | ใช่       | โมเดลเริ่มต้น |
| `xiaomi-token-plan/mimo-v2.5`     | ข้อความ, รูปภาพ | 1,048,576 | 131,072    | ใช่       | หลายรูปแบบ    |

`xiaomi-token-plan` ต้องใช้ URL ฐานตามภูมิภาคเพื่อแก้ไขค่า เส้นทางที่รองรับ
คือตัวเลือกการเริ่มต้นใช้งาน Token Plan ที่รวมมาให้ หรือบล็อกการกำหนดค่า
`models.providers.xiaomi-token-plan` ที่ระบุ `baseUrl` ไว้อย่างชัดเจน โดยจะ
ไม่มีการเสนอผู้ให้บริการหากไม่มีรายการใดรายการหนึ่งดังกล่าว

## โมเดลการให้เหตุผล

`mimo-v2.5` และ `mimo-v2.5-pro` รองรับ
[คำสั่ง `/think`](/th/tools/thinking) ของ OpenClaw ที่ระดับ `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` และ `max` (ค่าเริ่มต้น `high`)

## การแปลงข้อความเป็นเสียงพูด

Plugin `xiaomi` ที่รวมมาให้ยังลงทะเบียน Xiaomi MiMo เป็นผู้ให้บริการเสียงพูด
สำหรับ `messages.tts` โดยเรียกใช้สัญญา TTS สำหรับการเติมข้อความแชตของ Xiaomi พร้อม
ข้อความในรูปแบบข้อความ `assistant` และคำแนะนำด้านรูปแบบที่เลือกใช้ได้ในรูปแบบข้อความ `user`

| คุณสมบัติ | ค่า                                    |
| -------- | ---------------------------------------- |
| รหัส TTS   | `xiaomi` (นามแฝง `mimo`)                  |
| การยืนยันตัวตน     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` พร้อม `audio` |
| ค่าเริ่มต้น  | `mimo-v2.5-tts`, เสียง `mimo_default`    |
| เอาต์พุต   | ค่าเริ่มต้นเป็น MP3 และเป็น WAV เมื่อกำหนดค่า      |

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
          style: "โทนเสียงสดใส เป็นธรรมชาติ และเป็นกันเอง",
        },
      },
    },
  },
}
```

เสียงในตัว: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean` โมเดลเสียงที่ตั้งไว้ล่วงหน้า `mimo-v2.5-tts` ใช้ `audio.voice` ดังนั้น
OpenClaw จึงส่ง `speakerVoice` สำหรับโมเดลดังกล่าว

โมเดลออกแบบเสียง `mimo-v2.5-tts-voicedesign` จะสร้างเสียงจาก
พรอมต์รูปแบบภาษาธรรมชาติแทนรหัสเสียงที่ตั้งไว้ล่วงหน้า ตั้งค่า `style` เป็น
คำอธิบายเสียงที่ต้องการ โดย OpenClaw จะส่งค่านี้เป็นข้อความ `user` ส่ง
ข้อความที่จะอ่านออกเสียงเป็นข้อความ `assistant` และละเว้น `audio.voice` สำหรับ
โมเดลนี้

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "เสียงผู้หญิงที่อบอุ่น เป็นธรรมชาติ และออกเสียงชัดเจน",
        },
      },
    },
  },
}
```

สำหรับช่องทางที่ร้องขอเป้าหมายการสังเคราะห์บันทึกเสียง (Discord, Feishu,
Matrix, Telegram และ WhatsApp) OpenClaw จะแปลงรหัสเอาต์พุต Xiaomi เป็น Opus แบบโมโน 48kHz
ด้วย `ffmpeg` ก่อนส่ง

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2.5" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

ราคาและแฟล็กความเข้ากันได้มาจากไฟล์กำกับ Plugin ที่รวมมาให้ ดังนั้นตัวอย่างการกำหนดค่าจึงละเว้น `cost` และ `compat` เพื่อหลีกเลี่ยงความแตกต่างจากพฤติกรรมรันไทม์

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

ราคามาจากไฟล์กำกับที่รวมมาให้ (โมเดล Token Plan รวมการกำหนดราคาอ่านแคชแบบแบ่งระดับ) ดังนั้นตัวอย่างการกำหนดค่าจึงละเว้น `cost`

<AccordionGroup>
  <Accordion title="พฤติกรรมการแทรกอัตโนมัติ">
    ผู้ให้บริการ `xiaomi` จะเปิดใช้งานโดยอัตโนมัติเมื่อมีการตั้งค่า `XIAOMI_API_KEY` ในสภาพแวดล้อมหรือมีโปรไฟล์การยืนยันตัวตนอยู่ `xiaomi-token-plan` ต้องใช้ URL ฐานตามภูมิภาค ดังนั้นเส้นทางที่รองรับคือตัวเลือกการเริ่มต้นใช้งาน Token Plan ที่รวมมาให้ หรือบล็อกการกำหนดค่า `models.providers.xiaomi-token-plan` ที่ระบุไว้อย่างชัดเจน
  </Accordion>

  <Accordion title="รายละเอียดโมเดล">
    - **mimo-v2.5** - ค่าเริ่มต้นแบบจ่ายตามการใช้งานและเส้นทาง V2.5 แบบหลายรูปแบบของ Token Plan
    - **mimo-v2.5-pro** - โมเดลการให้เหตุผลรุ่นเรือธงและค่าเริ่มต้นของ Token Plan

    <Note>
    โมเดลแบบจ่ายตามการใช้งานใช้คำนำหน้า `xiaomi/` โมเดล Token Plan ใช้คำนำหน้า `xiaomi-token-plan/`
    </Note>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - หากโมเดลไม่ปรากฏ ให้ตรวจสอบว่ามีตัวแปรสภาพแวดล้อมของคีย์หรือโปรไฟล์การยืนยันตัวตนที่เกี่ยวข้อง และยังใช้งานได้
    - สำหรับ Token Plan ให้ตรวจสอบว่าภูมิภาคที่เลือกในการเริ่มต้นใช้งานตรงกับ URL ฐานในหน้าการสมัครใช้บริการ และคีย์ขึ้นต้นด้วย `tp-`
    - เมื่อ Gateway ทำงานเป็นดีมอน โปรดตรวจสอบว่าคีย์พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งค่าไว้เฉพาะในเชลล์แบบโต้ตอบจะไม่ปรากฏต่อโปรเซส Gateway ที่จัดการโดยดีมอน ใช้การกำหนดค่า `~/.openclaw/.env` หรือ `env.shellEnv` เพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="ระดับการคิด" href="/th/tools/thinking" icon="brain">
    ไวยากรณ์คำสั่ง `/think` และการจับคู่ระดับ
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw ฉบับสมบูรณ์
  </Card>
  <Card title="คอนโซล Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    แดชบอร์ด Xiaomi MiMo และการจัดการคีย์ API
  </Card>
</CardGroup>
